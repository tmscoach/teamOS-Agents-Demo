from langchain.agents import AgentExecutor
from langchain.memory import ConversationSummaryBufferMemory
from langchain.prompts import MessagesPlaceholder
from langchain.schema import BaseMessage
from typing import Dict, List, Optional
import enum

class ConversationState(enum.Enum):
    """Tracks the conversation progress"""
    GREETING = "greeting"
    CONTEXT_DISCOVERY = "context_discovery"
    CHALLENGE_EXPLORATION = "challenge_exploration"
    TMS_EXPLANATION = "tms_explanation"
    GOAL_SETTING = "goal_setting"
    RESOURCE_CONFIRMATION = "resource_confirmation"
    STAKEHOLDER_MAPPING = "stakeholder_mapping"
    RECAP_AND_HANDOFF = "recap_and_handoff"

class OnboardingAgentChain:
    """
    High-level LangChain flow for TMS Onboarding Agent
    """
    
    def __init__(self, llm, vector_store):
        self.llm = llm
        self.vector_store = vector_store  # Contains TMS knowledge base
        self.state = ConversationState.GREETING
        self.conversation_data = {}
        self.required_fields_status = {field: False for field in OnboardingGuardrails.REQUIRED_FIELDS}
        
        # Initialize memory with summary to track key points
        self.memory = ConversationSummaryBufferMemory(
            llm=llm,
            max_token_limit=2000,
            return_messages=True
        )
        
        # State-specific prompts
        self.state_prompts = {
            ConversationState.GREETING: self._create_greeting_prompt(),
            ConversationState.CONTEXT_DISCOVERY: self._create_context_prompt(),
            ConversationState.CHALLENGE_EXPLORATION: self._create_challenge_prompt(),
            ConversationState.TMS_EXPLANATION: self._create_tms_explanation_prompt(),
            ConversationState.GOAL_SETTING: self._create_goal_setting_prompt(),
            ConversationState.RESOURCE_CONFIRMATION: self._create_resource_prompt(),
            ConversationState.STAKEHOLDER_MAPPING: self._create_stakeholder_prompt(),
            ConversationState.RECAP_AND_HANDOFF: self._create_handoff_prompt()
        }
        
        # Initialize the agent
        self.agent = self._create_agent()
        
    def _create_agent(self):
        """Creates the main conversational agent"""
        
        tools = [
            # Tool to check conversation progress
            CheckProgressTool(self.required_fields_status),
            
            # Tool to retrieve TMS knowledge
            TMSKnowledgeRetrieverTool(self.vector_store),
            
            # Tool to validate manager inputs
            InputValidatorTool(),
            
            # Tool to generate appropriate questions
            QuestionGeneratorTool(self.state),
            
            # Tool to assess conversation quality
            QualityAssessmentTool()
        ]
        
        agent_prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        agent = create_openai_functions_agent(
            llm=self.llm,
            tools=tools,
            prompt=agent_prompt
        )
        
        return AgentExecutor(
            agent=agent,
            tools=tools,
            memory=self.memory,
            verbose=True,
            handle_parsing_errors=True
        )
    
    def _create_state_transition_chain(self):
        """Chain that manages state transitions"""
        
        def determine_next_state(current_state: ConversationState, 
                               conversation_data: Dict,
                               required_fields: Dict) -> ConversationState:
            """Logic for state transitions"""
            
            if current_state == ConversationState.GREETING:
                return ConversationState.CONTEXT_DISCOVERY
            
            elif current_state == ConversationState.CONTEXT_DISCOVERY:
                if all(conversation_data.get(f) for f in ["team_size", "team_tenure"]):
                    return ConversationState.CHALLENGE_EXPLORATION
                return current_state
            
            elif current_state == ConversationState.CHALLENGE_EXPLORATION:
                if conversation_data.get("primary_challenge"):
                    # Explain TMS after understanding challenges
                    return ConversationState.TMS_EXPLANATION
                return current_state
            
            elif current_state == ConversationState.TMS_EXPLANATION:
                if conversation_data.get("tms_understood"):
                    return ConversationState.GOAL_SETTING
                return current_state
            
            elif current_state == ConversationState.GOAL_SETTING:
                if conversation_data.get("success_metrics"):
                    return ConversationState.RESOURCE_CONFIRMATION
                return current_state
            
            elif current_state == ConversationState.RESOURCE_CONFIRMATION:
                if all(conversation_data.get(f) for f in ["timeline_preference", "budget_range"]):
                    return ConversationState.STAKEHOLDER_MAPPING
                return current_state
            
            elif current_state == ConversationState.STAKEHOLDER_MAPPING:
                if conversation_data.get("stakeholders_identified"):
                    return ConversationState.RECAP_AND_HANDOFF
                return current_state
            
            return current_state
    
    def _create_extraction_chain(self):
        """Chain that extracts structured data from conversation"""
        
        extraction_prompt = PromptTemplate(
            template="""
            Extract the following information from the conversation:
            - Team size (number)
            - Team tenure (how long team has existed)
            - Primary challenge (main issue to address)
            - Success metrics (what success looks like)
            - Timeline preference (8-week or 16-week)
            - Budget range (approximate budget)
            - Leader commitment (will leader participate)
            
            Conversation: {conversation}
            
            Return as JSON with these exact field names.
            """,
            input_variables=["conversation"]
        )
        
        return LLMChain(llm=self.llm, prompt=extraction_prompt)
    
    def _create_quality_check_chain(self):
        """Chain that assesses conversation quality"""
        
        quality_prompt = PromptTemplate(
            template="""
            Assess the quality of this onboarding conversation:
            
            Conversation: {conversation}
            
            Rate the following (1-5):
            1. Rapport building
            2. Information completeness  
            3. Manager engagement
            4. Clarity of next steps
            5. TMS understanding
            
            Also identify:
            - Any red flags
            - Missing critical information
            - Manager's confidence level
            
            Return as structured assessment.
            """,
            input_variables=["conversation"]
        )
        
        return LLMChain(llm=self.llm, prompt=quality_prompt)
    
    def _create_handoff_chain(self):
        """Chain that prepares handoff to Assessment Agent"""
        
        handoff_prompt = PromptTemplate(
            template="""
            Prepare a comprehensive handoff document for the Assessment Agent:
            
            Team Information: {team_info}
            Challenges: {challenges}
            Goals: {goals}
            Resources: {resources}
            Stakeholders: {stakeholders}
            
            Create a structured handoff that includes:
            1. Team profile summary
            2. Prioritized challenges
            3. SMART goals
            4. Recommended tool sequence
            5. Timeline and milestones
            6. Key stakeholder notes
            7. Any concerns or risks
            
            Format as JSON for agent consumption.
            """,
            input_variables=["team_info", "challenges", "goals", "resources", "stakeholders"]
        )
        
        return LLMChain(llm=self.llm, prompt=handoff_prompt)
    
    def run_conversation(self, manager_input: str) -> Dict:
        """Main conversation flow"""
        
        # Process manager input
        response = self.agent.run(input=manager_input)
        
        # Extract data from conversation
        extraction_chain = self._create_extraction_chain()
        extracted_data = extraction_chain.run(
            conversation=self.memory.buffer
        )
        self.conversation_data.update(extracted_data)
        
        # Update required fields status
        for field in OnboardingGuardrails.REQUIRED_FIELDS:
            if field in extracted_data and extracted_data[field]:
                self.required_fields_status[field] = True
        
        # Check for state transition
        next_state = self._create_state_transition_chain()(
            self.state, 
            self.conversation_data,
            self.required_fields_status
        )
        
        if next_state != self.state:
            self.state = next_state
            # Add state-specific context to response
            response += f"\n\n{self.state_prompts[self.state]}"
        
        # Quality check if nearing completion
        if self._calculate_completion_percentage() > 0.7:
            quality_chain = self._create_quality_check_chain()
            quality_assessment = quality_chain.run(
                conversation=self.memory.buffer
            )
            
            # Determine if ready for handoff
            if self._is_ready_for_handoff(quality_assessment):
                handoff_data = self._prepare_handoff()
                return {
                    "response": response,
                    "state": "complete",
                    "handoff_data": handoff_data
                }
        
        return {
            "response": response,
            "state": self.state.value,
            "completion": self._calculate_completion_percentage()
        }
    
    def _calculate_completion_percentage(self) -> float:
        """Calculate how complete the onboarding is"""
        completed = sum(1 for status in self.required_fields_status.values() if status)
        return completed / len(self.required_fields_status)
    
    def _is_ready_for_handoff(self, quality_assessment: Dict) -> bool:
        """Determine if ready to hand off to Assessment Agent"""
        return (
            self._calculate_completion_percentage() >= OnboardingGuardrails.HANDOFF_REQUIREMENTS["minimum_completeness"]
            and quality_assessment.get("manager_confidence") != "low"
            and quality_assessment.get("next_steps_clear") == True
        )
    
    def _prepare_handoff(self) -> Dict:
        """Prepare structured handoff data"""
        handoff_chain = self._create_handoff_chain()
        return handoff_chain.run(
            team_info=self.conversation_data.get("team_context", {}),
            challenges=self.conversation_data.get("challenges", []),
            goals=self.conversation_data.get("goals", {}),
            resources=self.conversation_data.get("resources", {}),
            stakeholders=self.conversation_data.get("stakeholders", [])
        )

# Example usage
def create_onboarding_agent():
    """Factory function to create configured onboarding agent"""
    
    llm = ChatOpenAI(model="gpt-4", temperature=0.7)
    
    # Load TMS knowledge base
    embeddings = OpenAIEmbeddings()
    vector_store = FAISS.load_local("tms_knowledge_base", embeddings)
    
    # Create agent
    agent = OnboardingAgentChain(llm, vector_store)
    
    return agent

# Streamlit or Gradio interface
def run_onboarding_interface():
    """Simple interface for the onboarding agent"""
    
    st.title("TMS Team Transformation Onboarding")
    st.write("Let's design a transformation journey for your team!")
    
    # Initialize agent in session state
    if "agent" not in st.session_state:
        st.session_state.agent = create_onboarding_agent()
        st.session_state.messages = []
    
    # Display conversation
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.write(message["content"])
    
    # Handle user input
    if prompt := st.chat_input("Your response:"):
        # Add user message
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Get agent response
        result = st.session_state.agent.run_conversation(prompt)
        
        # Add agent response
        st.session_state.messages.append({
            "role": "assistant", 
            "content": result["response"]
        })
        
        # Show progress
        st.progress(result.get("completion", 0))
        
        # Handle completion
        if result.get("state") == "complete":
            st.success("Onboarding complete! Preparing handoff to Assessment Agent...")
            st.json(result["handoff_data"])