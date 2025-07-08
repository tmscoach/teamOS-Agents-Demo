# Onboarding Agent Guardrails

class OnboardingGuardrails:
    """Guardrails to keep the Onboarding Agent focused and effective"""
    
    # Conversation Boundaries
    MAX_CONVERSATION_TIME = 45  # minutes
    MIN_CONVERSATION_TIME = 20  # minutes
    MAX_QUESTIONS_PER_TOPIC = 3
    MAX_TOTAL_QUESTIONS = 15
    
    # Required Information Checklist
    REQUIRED_FIELDS = [
        "current team situation",
        "biggest pain point right now",
        "timeline",
        "Have you used team assessments before"
    ]
    
    # Topics to Avoid
    FORBIDDEN_TOPICS = [
        "Detailed psychological analysis",
        "Medical or mental health diagnosis",
        "Specific salary/compensation discussions",
        "Comparison with other clients",
        "Guaranteeing specific outcomes",
        "Political or controversial topics"
    ]
    
    # Conversation Flow Rules
    FLOW_RULES = {
        "must_explain_tms": True,
        "must_get_explicit_goals": True,
        "must_confirm_resources": True,
        "must_address_concerns": True,
        "max_backtracking": 2,  # Times agent can return to previous topic
        "require_progressive_disclosure": True  # Don't overwhelm with all info at once
    }
    
    # Response Quality Checks
    RESPONSE_REQUIREMENTS = {
        "max_response_length": 150,  # words
        "require_question_per_response": False,  # Not every response needs a question
        "empathy_required": True,
        "jargon_limit": 3,  # TMS-specific terms per response
        "example_frequency": 0.3  # 30% of responses should include examples
    }
    
    # Handoff Criteria
    HANDOFF_REQUIREMENTS = {
        "minimum_completeness": 0.8,  # 80% of required fields
        "manager_confidence_level": "medium",  # low/medium/high
        "next_steps_clarity": True,
        "calendar_scheduled": True  # Next meeting must be scheduled
    }
    
    # Escalation Triggers
    ESCALATION_TRIGGERS = [
        "Manager expresses strong skepticism after explanation",
        "Budget is below minimum viable ($5k)",
        "Timeline shorter than 6 weeks",
        "Team size over 50 people",
        "Multiple failed teams mentioned",
        "Legal or compliance concerns raised",
        "Manager refuses to participate in assessments"
    ]
    
    # Quality Metrics
    QUALITY_METRICS = {
        "rapport_indicators": [
            "Manager shares beyond prompted questions",
            "Manager asks clarifying questions",
            "Manager expresses enthusiasm",
            "Manager relates TMS to their situation"
        ],
        "completion_indicators": [
            "All required fields captured",
            "Goals are SMART",
            "Timeline is realistic",
            "Resources confirmed"
        ]
    }