# API Sequence Documentation

Generated: 2025-07-22T12:42:01.011Z

Total API Calls: 28

## Subscription 21988

### 1. GET https://localhost:8001/Workflow/Process/21988/12/13/98

- **Timestamp**: 22/07/2025, 7:40:36 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/98",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 2. GET https://localhost:8001/Workflow/Process/21988/12/13/98

- **Timestamp**: 22/07/2025, 7:40:36 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/98",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": {
    "PageID": 98,
    "Overview": "<div style=\"margin-left:20px\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_2of7\" height=\"20px\">&nbsp; &nbsp;<b>Page 2</b> of 7</h6><p>&nbsp;</p><h4><strong>Read each statement and decide how strongly you agree or disagree</strong></h4></div>",
    "Description": "TSQ - Page 02",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 534,
        "IsForm": false,
        "Description": "Q6",
        "Prompt": "There are clear lines of accountability and authority",
        "Number": "6-10",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "QuestionGroupHeader": "Statement",
        "UseHorizontalLayout": true,
        "QuestionAreaColumnWidth": 5,
        "AnswerAreaColumnWidth": 4,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 535,
        "IsForm": false,
        "Description": "Q7",
        "Prompt": "We regularly question our way of working",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 536,
        "IsForm": false,
        "Description": "Q8",
        "Prompt": "We can see the opportunities that lie ahead of us",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 537,
        "IsForm": false,
        "Description": "Q9",
        "Prompt": "We have key benchmarks against which to measure performance",
        "Index": 0,
        "SortOrder": 9,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 538,
        "IsForm": false,
        "Description": "Q10",
        "Prompt": "Our Team Purpose is aligned with the organisational vision",
        "Index": 0,
        "SortOrder": 10,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      }
    ],
    "BaseContentID": 12,
    "CurrentSectionID": 13,
    "NextPageID": 99,
    "CurrentPageID": 98,
    "PreviousPageID": 97,
    "SubscriptionID": 21988
  }
}
```

---

### 3. GET https://localhost:8001/Workflow/Process/21988/12/13/99

- **Timestamp**: 22/07/2025, 7:40:47 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/99",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 4. GET https://localhost:8001/Workflow/Process/21988/12/13/99

- **Timestamp**: 22/07/2025, 7:40:47 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/99",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": {
    "PageID": 99,
    "Overview": "<div style=\"margin-left:20px\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_3of7\" height=\"20px\">&nbsp; &nbsp;<b>Page 3</b> of 7</h6><p>&nbsp;</p><h4><strong>Read each statement and decide how strongly you agree or disagree</strong></h4></div>",
    "Description": "TSQ - Page 03",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 540,
        "IsForm": false,
        "Description": "Q11",
        "Prompt": "We understand the different personal values held by team members",
        "Number": "11-15",
        "Index": 0,
        "SortOrder": 11,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "QuestionGroupHeader": "Statement",
        "UseHorizontalLayout": true,
        "QuestionAreaColumnWidth": 5,
        "AnswerAreaColumnWidth": 4,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 541,
        "IsForm": false,
        "Description": "Q12",
        "Prompt": "Learning from mistakes is encouraged",
        "Index": 0,
        "SortOrder": 12,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 542,
        "IsForm": false,
        "Description": "Q13",
        "Prompt": "We have action plans that we follow carefully",
        "Index": 0,
        "SortOrder": 13,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 543,
        "IsForm": false,
        "Description": "Q14",
        "Prompt": "Individual team members are adequately rewarded",
        "Index": 0,
        "SortOrder": 14,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 544,
        "IsForm": false,
        "Description": "Q15",
        "Prompt": "We monitor potential obstacles and are prepared for them",
        "Index": 0,
        "SortOrder": 15,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      }
    ],
    "BaseContentID": 12,
    "CurrentSectionID": 13,
    "NextPageID": 100,
    "CurrentPageID": 99,
    "PreviousPageID": 98,
    "SubscriptionID": 21988
  }
}
```

---

### 5. GET https://localhost:8001/Workflow/Process/21988/12/13/100

- **Timestamp**: 22/07/2025, 7:40:58 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/100",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 6. GET https://localhost:8001/Workflow/Process/21988/12/13/100

- **Timestamp**: 22/07/2025, 7:40:58 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/100",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": {
    "PageID": 100,
    "Overview": "<div style=\"margin-left:20px\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_4of7\" height=\"20px\">&nbsp; &nbsp;<b>Page 4</b> of 7</h6><p>&nbsp;</p><h4><strong>Read each statement and decide how strongly you agree or disagree</strong></h4></div>",
    "Description": "TSQ - Page 04",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 546,
        "IsForm": false,
        "Description": "Q16",
        "Prompt": "Positive feedback is openly given",
        "Number": "16-20",
        "Index": 0,
        "SortOrder": 16,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "QuestionGroupHeader": "Statement",
        "UseHorizontalLayout": true,
        "QuestionAreaColumnWidth": 5,
        "AnswerAreaColumnWidth": 4,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 547,
        "IsForm": false,
        "Description": "Q17",
        "Prompt": "Individual skills gaps are identified and training and development provided",
        "Index": 0,
        "SortOrder": 17,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 548,
        "IsForm": false,
        "Description": "Q18",
        "Prompt": "We conduct regular team performance audits",
        "Index": 0,
        "SortOrder": 18,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 549,
        "IsForm": false,
        "Description": "Q19",
        "Prompt": "Team strengths and weaknesses are clear to all",
        "Index": 0,
        "SortOrder": 19,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 550,
        "IsForm": false,
        "Description": "Q20",
        "Prompt": "The team is well balanced to cope with all aspects of teamwork",
        "Index": 0,
        "SortOrder": 20,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      }
    ],
    "BaseContentID": 12,
    "CurrentSectionID": 13,
    "NextPageID": 101,
    "CurrentPageID": 100,
    "PreviousPageID": 99,
    "SubscriptionID": 21988
  }
}
```

---

### 7. GET https://localhost:8001/Workflow/Process/21988/12/13/101

- **Timestamp**: 22/07/2025, 7:41:08 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/101",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 8. GET https://localhost:8001/Workflow/Process/21988/12/13/101

- **Timestamp**: 22/07/2025, 7:41:08 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/101",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": {
    "PageID": 101,
    "Overview": "<div style=\"margin-left:20px\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_5of7\" height=\"20px\">&nbsp; &nbsp;<b>Page 5</b> of 7</h6><p>&nbsp;</p><h4><strong>Read each statement and decide how strongly you agree or disagree</strong></h4></div>",
    "Description": "TSQ - Page 05",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 552,
        "IsForm": false,
        "Description": "Q21",
        "Prompt": "There are clear ground rules defining acceptable workplace behaviour that we all follow",
        "Number": "21-25",
        "Index": 0,
        "SortOrder": 21,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "QuestionGroupHeader": "Statement",
        "UseHorizontalLayout": true,
        "QuestionAreaColumnWidth": 5,
        "AnswerAreaColumnWidth": 4,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 553,
        "IsForm": false,
        "Description": "Q22",
        "Prompt": "We know what support we need for the team to function at a high level",
        "Index": 0,
        "SortOrder": 22,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 554,
        "IsForm": false,
        "Description": "Q23",
        "Prompt": "We have unambiguous job descriptions and know each person's role in the team",
        "Index": 0,
        "SortOrder": 23,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 555,
        "IsForm": false,
        "Description": "Q24",
        "Prompt": "We know how each team member approaches risk",
        "Index": 0,
        "SortOrder": 24,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 556,
        "IsForm": false,
        "Description": "Q25",
        "Prompt": "We value diversity",
        "Index": 0,
        "SortOrder": 25,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      }
    ],
    "BaseContentID": 12,
    "CurrentSectionID": 13,
    "NextPageID": 102,
    "CurrentPageID": 101,
    "PreviousPageID": 100,
    "SubscriptionID": 21988
  }
}
```

---

### 9. GET https://localhost:8001/Workflow/Process/21988/12/13/102

- **Timestamp**: 22/07/2025, 7:41:19 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/102",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 10. GET https://localhost:8001/Workflow/Process/21988/12/13/102

- **Timestamp**: 22/07/2025, 7:41:19 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/102",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": {
    "PageID": 102,
    "Overview": "<div style=\"margin-left:20px\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_6of7\" height=\"20px\">&nbsp; &nbsp;<b>Page 6</b> of 7</h6><p>&nbsp;</p><h4><strong>Read each statement and decide how strongly you agree or disagree</strong></h4></div>",
    "Description": "TSQ - Page 06",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 558,
        "IsForm": false,
        "Description": "Q26",
        "Prompt": "We are performing at a high level",
        "Number": "26-30",
        "Index": 0,
        "SortOrder": 26,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "QuestionGroupHeader": "Statement",
        "UseHorizontalLayout": true,
        "QuestionAreaColumnWidth": 5,
        "AnswerAreaColumnWidth": 4,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 559,
        "IsForm": false,
        "Description": "Q27",
        "Prompt": "We know specifically what team outputs and outcomes are necessary to meet organisational expectations",
        "Index": 0,
        "SortOrder": 27,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 560,
        "IsForm": false,
        "Description": "Q28",
        "Prompt": "We focus on the critical tasks that ensure success and don't get sidetracked",
        "Index": 0,
        "SortOrder": 28,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 561,
        "IsForm": false,
        "Description": "Q29",
        "Prompt": "We all take responsibility for our actions",
        "Index": 0,
        "SortOrder": 29,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 562,
        "IsForm": false,
        "Description": "Q30",
        "Prompt": "Personal learning is encouraged",
        "Index": 0,
        "SortOrder": 30,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      }
    ],
    "BaseContentID": 12,
    "CurrentSectionID": 13,
    "NextPageID": 103,
    "CurrentPageID": 102,
    "PreviousPageID": 101,
    "SubscriptionID": 21988
  }
}
```

---

### 11. GET https://localhost:8001/Workflow/Process/21988/12/13/103

- **Timestamp**: 22/07/2025, 7:41:29 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/103",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 12. GET https://localhost:8001/Workflow/Process/21988/12/13/103

- **Timestamp**: 22/07/2025, 7:41:29 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21988/12/13/103",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": {
    "PageID": 103,
    "Overview": "<div style=\"margin-left:20px\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_7of7\" height=\"20px\">&nbsp; &nbsp;<b>Page 7</b> of 7</h6><p>&nbsp;</p><h4><strong>Read each statement and decide how strongly you agree or disagree</strong></h4></div>",
    "Description": "TSQ - Page 07",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 564,
        "IsForm": false,
        "Description": "Q31",
        "Prompt": "Interaction processes among team members are regularly discussed and reviewed",
        "Number": "31-32",
        "Index": 0,
        "SortOrder": 31,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "QuestionGroupHeader": "Statement",
        "UseHorizontalLayout": true,
        "QuestionAreaColumnWidth": 5,
        "AnswerAreaColumnWidth": 4,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 565,
        "IsForm": false,
        "Description": "Q32",
        "Prompt": "The whole team is rewarded and not just individuals",
        "Index": 0,
        "SortOrder": 32,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 16,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||MultipleChoice|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": true,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": true,
        "ListValues": [],
        "ListOptions": [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      }
    ],
    "BaseContentID": 12,
    "CurrentSectionID": 13,
    "CurrentPageID": 103,
    "PreviousPageID": 102,
    "SubscriptionID": 21988
  }
}
```

---

## General API Calls

### 1. GET https://localhost:8001/api/v1/workflow/process?subscriptionId=21988

- **Timestamp**: 22/07/2025, 7:40:07 pm
- **Status**: PENDING
- **Source**: MCP-Optimized
- **Tool**: tms_get_workflow_process

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/api/v1/workflow/process?subscriptionId=21988",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionId": 21988
  }
}
```

---

### 2. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:40:36 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 97,
    "currentPageID": 97,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 98,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 528,
        "value": "Strongly Agree"
      },
      {
        "questionID": 529,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 530,
        "value": "Strongly Disagree"
      },
      {
        "questionID": 531,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 532,
        "value": "Mostly Disagree"
      }
    ]
  }
}
```

---

### 3. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:40:36 pm
- **Status**: 200
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 97,
    "currentPageID": 97,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 98,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 528,
        "value": "Strongly Agree"
      },
      {
        "questionID": 529,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 530,
        "value": "Strongly Disagree"
      },
      {
        "questionID": 531,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 532,
        "value": "Mostly Disagree"
      }
    ]
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": true
}
```

---

### 4. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:40:47 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 98,
    "currentPageID": 98,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 99,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 534,
        "value": "Strongly Agree"
      },
      {
        "questionID": 535,
        "value": "Mostly Agree"
      },
      {
        "questionID": 536,
        "value": "Strongly Disagree"
      },
      {
        "questionID": 537,
        "value": "Mostly Agree"
      },
      {
        "questionID": 538,
        "value": "Mostly Agree"
      }
    ]
  }
}
```

---

### 5. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:40:47 pm
- **Status**: 200
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 98,
    "currentPageID": 98,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 99,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 534,
        "value": "Strongly Agree"
      },
      {
        "questionID": 535,
        "value": "Mostly Agree"
      },
      {
        "questionID": 536,
        "value": "Strongly Disagree"
      },
      {
        "questionID": 537,
        "value": "Mostly Agree"
      },
      {
        "questionID": 538,
        "value": "Mostly Agree"
      }
    ]
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": true
}
```

---

### 6. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:40:57 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 99,
    "currentPageID": 99,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 100,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 540,
        "value": "Strongly Agree"
      },
      {
        "questionID": 541,
        "value": "Mostly Agree"
      },
      {
        "questionID": 542,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 543,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 544,
        "value": "Strongly Disagree"
      }
    ]
  }
}
```

---

### 7. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:40:58 pm
- **Status**: 200
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 99,
    "currentPageID": 99,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 100,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 540,
        "value": "Strongly Agree"
      },
      {
        "questionID": 541,
        "value": "Mostly Agree"
      },
      {
        "questionID": 542,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 543,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 544,
        "value": "Strongly Disagree"
      }
    ]
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": true
}
```

---

### 8. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:41:07 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 100,
    "currentPageID": 100,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 101,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 546,
        "value": "Strongly Agree"
      },
      {
        "questionID": 547,
        "value": "Mostly Agree"
      },
      {
        "questionID": 548,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 549,
        "value": "Strongly Disagree"
      },
      {
        "questionID": 550,
        "value": "Mostly Disagree"
      }
    ]
  }
}
```

---

### 9. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:41:08 pm
- **Status**: 200
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 100,
    "currentPageID": 100,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 101,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 546,
        "value": "Strongly Agree"
      },
      {
        "questionID": 547,
        "value": "Mostly Agree"
      },
      {
        "questionID": 548,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 549,
        "value": "Strongly Disagree"
      },
      {
        "questionID": 550,
        "value": "Mostly Disagree"
      }
    ]
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": true
}
```

---

### 10. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:41:19 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 101,
    "currentPageID": 101,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 102,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 552,
        "value": "Strongly Agree"
      },
      {
        "questionID": 553,
        "value": "Mostly Agree"
      },
      {
        "questionID": 554,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 555,
        "value": "Mostly Agree"
      },
      {
        "questionID": 556,
        "value": "Strongly Disagree"
      }
    ]
  }
}
```

---

### 11. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:41:19 pm
- **Status**: 200
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 101,
    "currentPageID": 101,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 102,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 552,
        "value": "Strongly Agree"
      },
      {
        "questionID": 553,
        "value": "Mostly Agree"
      },
      {
        "questionID": 554,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 555,
        "value": "Mostly Agree"
      },
      {
        "questionID": 556,
        "value": "Strongly Disagree"
      }
    ]
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": true
}
```

---

### 12. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:41:29 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 102,
    "currentPageID": 102,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 103,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 558,
        "value": "Strongly Agree"
      },
      {
        "questionID": 559,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 560,
        "value": "Mostly Agree"
      },
      {
        "questionID": 561,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 562,
        "value": "Strongly Disagree"
      }
    ]
  }
}
```

---

### 13. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:41:29 pm
- **Status**: 200
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 102,
    "currentPageID": 102,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": 103,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 558,
        "value": "Strongly Agree"
      },
      {
        "questionID": 559,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 560,
        "value": "Mostly Agree"
      },
      {
        "questionID": 561,
        "value": "Mostly Disagree"
      },
      {
        "questionID": 562,
        "value": "Strongly Disagree"
      }
    ]
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": true
}
```

---

### 14. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:41:40 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 103,
    "currentPageID": 103,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": null,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 564,
        "value": "Strongly Agree"
      },
      {
        "questionID": 565,
        "value": "Strongly Disagree"
      }
    ]
  }
}
```

---

### 15. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 7:41:40 pm
- **Status**: 200
- **Source**: WorkflowSubmit
- **Tool**: tms_update_workflow

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/Workflow/Update",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionID": 21988,
    "pageID": 103,
    "currentPageID": 103,
    "currentSectionID": 13,
    "baseContentID": 12,
    "nextPageID": null,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 564,
        "value": "Strongly Agree"
      },
      {
        "questionID": 565,
        "value": "Strongly Disagree"
      }
    ]
  }
}
```

**Response:**
```json
{
  "status": 200,
  "statusText": "OK",
  "data": true
}
```

---

### 16. POST https://localhost:8001/api/mcp/tms_get_workflow_process

- **Timestamp**: 22/07/2025, 7:40:07 pm
- **Status**: 200
- **Source**: MCP
- **Tool**: tms_get_workflow_process

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/api/mcp/tms_get_workflow_process",
  "data": {
    "subscriptionId": 21988
  }
}
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "success": true,
    "data": {
      "PageID": 97,
      "Overview": "<div style=\"margin-left:20px\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_1of7\" height=\"20px\">&nbsp; &nbsp;<b>Page 1</b> of 7</h6><p>&nbsp;</p><h4><strong>Team Name: BHP</strong></h4><div><strong><br></strong></div><h4><strong>Read each statement and decide how strongly you agree or disagree</strong></h4></div>",
      "Description": "TSQ - Page 01",
      "Questions": [
        {
          "ID": 0,
          "QuestionID": 528,
          "IsForm": false,
          "Description": "Q1",
          "Prompt": "We know what work each team member prefers to do",
          "Number": "1-5",
          "Index": 0,
          "SortOrder": 2,
          "IsEnabled": true,
          "AllowMultipleSelections": false,
          "ForceUpperCase": false,
          "Type": 16,
          "AnswerBoolean": false,
          "AnswerMultiple": [],
          "Validation": "||||MultipleChoice|False",
          "IsRequired": true,
          "AllowNegative": false,
          "KeepWithNext": true,
          "KeepWithNextItemised": false,
          "QuestionGroupHeader": "Statement",
          "UseHorizontalLayout": true,
          "QuestionAreaColumnWidth": 5,
          "AnswerAreaColumnWidth": 4,
          "ListValues": [],
          "ListOptions": [
            "Strongly Agree",
            "Mostly Agree",
            "Mostly Disagree",
            "Strongly Disagree"
          ]
        },
        {
          "ID": 0,
          "QuestionID": 529,
          "IsForm": false,
          "Description": "Q2",
          "Prompt": "We have clear individual and team objectives",
          "Index": 0,
          "SortOrder": 3,
          "IsEnabled": true,
          "AllowMultipleSelections": false,
          "ForceUpperCase": false,
          "Type": 16,
          "AnswerBoolean": false,
          "AnswerMultiple": [],
          "Validation": "||||MultipleChoice|False",
          "IsRequired": true,
          "AllowNegative": false,
          "KeepWithNext": true,
          "KeepWithNextItemised": false,
          "UseHorizontalLayout": true,
          "ListValues": [],
          "ListOptions": [
            "Strongly Agree",
            "Mostly Agree",
            "Mostly Disagree",
            "Strongly Disagree"
          ]
        },
        {
          "ID": 0,
          "QuestionID": 530,
          "IsForm": false,
          "Description": "Q3",
          "Prompt": "We celebrate our successes",
          "Index": 0,
          "SortOrder": 4,
          "IsEnabled": true,
          "AllowMultipleSelections": false,
          "ForceUpperCase": false,
          "Type": 16,
          "AnswerBoolean": false,
          "AnswerMultiple": [],
          "Validation": "||||MultipleChoice|False",
          "IsRequired": true,
          "AllowNegative": false,
          "KeepWithNext": true,
          "KeepWithNextItemised": false,
          "UseHorizontalLayout": true,
          "ListValues": [],
          "ListOptions": [
            "Strongly Agree",
            "Mostly Agree",
            "Mostly Disagree",
            "Strongly Disagree"
          ]
        },
        {
          "ID": 0,
          "QuestionID": 531,
          "IsForm": false,
          "Description": "Q4",
          "Prompt": "We understand our Team Purpose and why we exist as a team",
          "Index": 0,
          "SortOrder": 5,
          "IsEnabled": true,
          "AllowMultipleSelections": false,
          "ForceUpperCase": false,
          "Type": 16,
          "AnswerBoolean": false,
          "AnswerMultiple": [],
          "Validation": "||||MultipleChoice|False",
          "IsRequired": true,
          "AllowNegative": false,
          "KeepWithNext": true,
          "KeepWithNextItemised": false,
          "UseHorizontalLayout": true,
          "ListValues": [],
          "ListOptions": [
            "Strongly Agree",
            "Mostly Agree",
            "Mostly Disagree",
            "Strongly Disagree"
          ]
        },
        {
          "ID": 0,
          "QuestionID": 532,
          "IsForm": false,
          "Description": "Q5",
          "Prompt": "We know what the organisational vision is",
          "Index": 0,
          "SortOrder": 6,
          "IsEnabled": true,
          "AllowMultipleSelections": false,
          "ForceUpperCase": false,
          "Type": 16,
          "AnswerBoolean": false,
          "AnswerMultiple": [],
          "Validation": "||||MultipleChoice|False",
          "IsRequired": true,
          "AllowNegative": false,
          "KeepWithNext": true,
          "KeepWithNextItemised": false,
          "UseHorizontalLayout": true,
          "ListValues": [],
          "ListOptions": [
            "Strongly Agree",
            "Mostly Agree",
            "Mostly Disagree",
            "Strongly Disagree"
          ]
        }
      ],
      "BaseContentID": 12,
      "CurrentSectionID": 13,
      "NextPageID": 98,
      "CurrentPageID": 97,
      "SubscriptionID": 21988
    },
    "message": "Workflow process retrieved successfully",
    "navigationContext": "📋 Active Workflow: Unknown\n📍 Subscription ID: 21988\n📊 Pages Completed: 0\n\n🧭 Navigation Status:\nCurrent Page: 97\nCurrent Section: 13\nCurrent Base Content: 12\n\n✅ Next Page Available: 98\n\n💡 Next Action:\nTo continue the workflow, use: tms_get_workflow_process with parameters: subscriptionId: 21988, baseContentId: 12, sectionId: 13, pageId: 98"
  }
}
```

---

