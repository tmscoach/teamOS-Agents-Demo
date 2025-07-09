{
  "states": [
    {
      "name": "greeting",
      "description": "Welcome manager and set expectations",
      "objectives": [
        "Warm welcome",
        "Explain 5-minute process",
        "Set informal tone"
      ],
      "duration": "30 seconds",
      "key_outputs": []
    },
    {
      "name": "basic_info",
      "description": "Collect basic identification information",
      "objectives": [
        "Get manager's name",
        "Get organization name",
        "Get team size"
      ],
      "duration": "1 minute",
      "key_outputs": [
        "manager_name",
        "organization",
        "team_size"
      ]
    },
    {
      "name": "challenge_capture",
      "description": "Understand primary team challenge",
      "objectives": [
        "Identify main pain point",
        "Understand urgency"
      ],
      "duration": "2 minutes",
      "key_outputs": [
        "primary_challenge",
        "challenge_impact"
      ]
    },
    {
      "name": "timeline_check",
      "description": "Understand their timeline preferences",
      "objectives": [
        "When they want to start",
        "How fast they need results"
      ],
      "duration": "1 minute",
      "key_outputs": [
        "start_preference",
        "urgency_level"
      ]
    },
    {
      "name": "wrap_up",
      "description": "Confirm details and set next steps",
      "objectives": [
        "Summarize what we learned",
        "Confirm next step",
        "Thank them"
      ],
      "duration": "30 seconds",
      "key_outputs": [
        "confirmed_details",
        "next_action"
      ]
    }
  ],
  "transitions": [
    {
      "from": "greeting",
      "to": "basic_info",
      "condition": "greeting_acknowledged",
      "action": "start_questions"
    },
    {
      "from": "basic_info",
      "to": "challenge_capture",
      "condition": "basic_info_complete",
      "action": "dig_into_challenges"
    },
    {
      "from": "challenge_capture",
      "to": "timeline_check",
      "condition": "challenge_identified",
      "action": "check_timeline"
    },
    {
      "from": "timeline_check",
      "to": "wrap_up",
      "condition": "timeline_captured",
      "action": "summarize_and_close"
    },
    {
      "from": "wrap_up",
      "to": "END",
      "condition": "confirmation_received",
      "action": "schedule_discovery"
    }
  ]
}