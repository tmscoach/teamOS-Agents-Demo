# API Sequence Documentation

Generated: 2025-07-22T12:08:12.492Z

Total API Calls: 54

## Subscription 21989

### 1. GET https://localhost:8001/Workflow/Process/21989/3/2/3

- **Timestamp**: 22/07/2025, 6:57:06 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/3",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 2. GET https://localhost:8001/Workflow/Process/21989/3/2/3

- **Timestamp**: 22/07/2025, 6:57:06 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/3",
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
    "PageID": 3,
    "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_2of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 2</strong> of 12</h6><p></p><h4><strong>Answer according to the way you prefer to work</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>",
    "Description": "TMPQ - Page 02",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 10,
        "IsForm": false,
        "Description": "Question 6",
        "Prompt": "6)",
        "Number": "6",
        "StatementA": "I find talking things over with others helps me come to decisions",
        "StatementB": "I prefer to be left alone to come to decisions",
        "Index": 0,
        "SortOrder": 5,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 11,
        "IsForm": false,
        "Description": "Question 7",
        "Prompt": "7)",
        "Number": "7",
        "StatementA": "I actively search out theories",
        "StatementB": "I'm a practical person and I don't spend much time theorising",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 12,
        "IsForm": false,
        "Description": "Question 8",
        "Prompt": "8)",
        "Number": "8",
        "StatementA": "I probably take longer than others to make decisions because I like to gather as much information as possible",
        "StatementB": "I am probably quicker to make decisions than others as I like to see action and results",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 13,
        "IsForm": false,
        "Description": "Question 9",
        "Prompt": "9)",
        "Number": "9",
        "StatementA": "On balance I am more outgoing",
        "StatementB": "On balance I am more quiet",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 14,
        "IsForm": false,
        "Description": "Question 10",
        "Prompt": "10)",
        "Number": "10",
        "StatementA": "Logical analysis comes first with me",
        "StatementB": "People's feelings come first with me",
        "Index": 0,
        "SortOrder": 9,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      }
    ],
    "BaseContentID": 3,
    "CurrentSectionID": 2,
    "NextPageID": 4,
    "CurrentPageID": 3,
    "PreviousPageID": 2,
    "SubscriptionID": 21989,
    "NextBaseContentID": 79,
    "PreviousBaseContentID": 85
  }
}
```

---

### 3. GET https://localhost:8001/Workflow/Process/21989/3/2/4

- **Timestamp**: 22/07/2025, 6:57:22 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/4",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 4. GET https://localhost:8001/Workflow/Process/21989/3/2/4

- **Timestamp**: 22/07/2025, 6:57:22 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/4",
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
    "PageID": 4,
    "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_3of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 3</strong> of 12</h6><p></p><h4><strong>Answer according to the way you prefer to work</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>",
    "Description": "TMPQ - Page 03",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 15,
        "IsForm": false,
        "Description": "Question 11",
        "Prompt": "11)",
        "Number": "11",
        "StatementA": "I often change my mind at the last minute",
        "StatementB": "I attach a high value to planning ahead and dislike changing my mind at the last minute",
        "Index": 0,
        "SortOrder": 5,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 16,
        "IsForm": false,
        "Description": "Question 12",
        "Prompt": "12)",
        "Number": "12",
        "StatementA": "When making decisions I often rely on my 'gut feeling' rather than spending much time analysing the situation",
        "StatementB": "When making decisions I usually analyse the situation fully rather than rely on 'gut feeling'",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 17,
        "IsForm": false,
        "Description": "Question 13",
        "Prompt": "13)",
        "Number": "13",
        "StatementA": "I prefer more of an organising role to an advisory role",
        "StatementB": "I prefer more of an advisory role to an organising role",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 18,
        "IsForm": false,
        "Description": "Question 14",
        "Prompt": "14)",
        "Number": "14",
        "StatementA": "I find it requires a special effort to mix with people I do not know well",
        "StatementB": "I find it relatively easy to mix with people whom I do not know well",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 19,
        "IsForm": false,
        "Description": "Question 15",
        "Prompt": "15)",
        "Number": "15",
        "StatementA": "I prefer possibilities",
        "StatementB": "I prefer realities",
        "Index": 0,
        "SortOrder": 9,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      }
    ],
    "BaseContentID": 3,
    "CurrentSectionID": 2,
    "NextPageID": 5,
    "CurrentPageID": 4,
    "PreviousPageID": 3,
    "SubscriptionID": 21989,
    "NextBaseContentID": 79,
    "PreviousBaseContentID": 85
  }
}
```

---

### 5. GET https://localhost:8001/Workflow/Process/21989/3/2/5

- **Timestamp**: 22/07/2025, 6:57:32 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/5",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 6. GET https://localhost:8001/Workflow/Process/21989/3/2/5

- **Timestamp**: 22/07/2025, 6:57:32 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/5",
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
    "PageID": 5,
    "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_4of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 4</strong> of 12</h6><p></p><h4><strong>Answer according to the way you prefer to work</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>",
    "Description": "TMPQ - Page 04",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 20,
        "IsForm": false,
        "Description": "Question 16",
        "Prompt": "16)",
        "Number": "16",
        "StatementA": "I like work which involves a high degree of visibility such as making presentations at meetings",
        "StatementB": "I like work which involves low public visibility where I can do my work in my own time",
        "Index": 0,
        "SortOrder": 4,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 21,
        "IsForm": false,
        "Description": "Question 17",
        "Prompt": "17)",
        "Number": "17",
        "StatementA": "People may describe me as 'down-to-earth' because I prefer the commonsense approach",
        "StatementB": "People may describe me as having 'my head in the clouds' because I'm often dreaming up new ideas and ways of changing things",
        "Index": 0,
        "SortOrder": 5,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 22,
        "IsForm": false,
        "Description": "Question 18",
        "Prompt": "18)",
        "Number": "18",
        "StatementA": "I try to keep my personal feelings to the minimum when work decisions have to be made",
        "StatementB": "My personal feelings and beliefs are important influences in my work decisions",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 23,
        "IsForm": false,
        "Description": "Question 19",
        "Prompt": "19)",
        "Number": "19",
        "StatementA": "When organising my work, I usually come to temporary decisions and revise them when necessary",
        "StatementB": "When organising my work, I usually come to a decision and stick to it as far as possible",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 24,
        "IsForm": false,
        "Description": "Question 20",
        "Prompt": "20)",
        "Number": "20",
        "StatementA": "In a group at work, on average I would talk less than others",
        "StatementB": "In a group at work, on average I would talk more than others",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      }
    ],
    "BaseContentID": 3,
    "CurrentSectionID": 2,
    "NextPageID": 6,
    "CurrentPageID": 5,
    "PreviousPageID": 4,
    "SubscriptionID": 21989,
    "NextBaseContentID": 79,
    "PreviousBaseContentID": 85
  }
}
```

---

### 7. GET https://localhost:8001/Workflow/Process/21989/3/2/6

- **Timestamp**: 22/07/2025, 6:57:43 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/6",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 8. GET https://localhost:8001/Workflow/Process/21989/3/2/6

- **Timestamp**: 22/07/2025, 6:57:43 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/6",
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
    "PageID": 6,
    "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_5of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 5</strong> of 12</h6><p></p><h4><strong>Answer according to the way you prefer to work</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>",
    "Description": "TMPQ - Page 05",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 25,
        "IsForm": false,
        "Description": "Question 21",
        "Prompt": "21)",
        "Number": "21",
        "StatementA": "I plan work to avoid the unexpected wherever possible",
        "StatementB": "I often leave things unplanned and respond well to the unexpected",
        "Index": 0,
        "SortOrder": 4,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 26,
        "IsForm": false,
        "Description": "Question 22",
        "Prompt": "22)",
        "Number": "22",
        "StatementA": "I often come up with new ideas but I don't always know how to make them work",
        "StatementB": "I usually know how to make things work but don't always come up with new ideas",
        "Index": 0,
        "SortOrder": 5,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 27,
        "IsForm": false,
        "Description": "Question 23",
        "Prompt": "23)",
        "Number": "23",
        "StatementA": "I am easy to get to know as I like meeting lots of people",
        "StatementB": "I'm fairly quiet and people don't always know the real me",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 28,
        "IsForm": false,
        "Description": "Question 24",
        "Prompt": "24)",
        "Number": "24",
        "StatementA": "I prefer clear rules so that everyone knows what to do and work is completed correctly",
        "StatementB": "I prefer fewer rules and procedures so that changes are easier to make when needed",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 29,
        "IsForm": false,
        "Description": "Question 25",
        "Prompt": "25)",
        "Number": "25",
        "StatementA": "I come up with my best ideas working in groups",
        "StatementB": "I come up with my best ideas working by myself",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      }
    ],
    "BaseContentID": 3,
    "CurrentSectionID": 2,
    "NextPageID": 7,
    "CurrentPageID": 6,
    "PreviousPageID": 5,
    "SubscriptionID": 21989,
    "NextBaseContentID": 79,
    "PreviousBaseContentID": 85
  }
}
```

---

### 9. GET https://localhost:8001/Workflow/Process/21989/3/2/7

- **Timestamp**: 22/07/2025, 6:57:54 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/7",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 10. GET https://localhost:8001/Workflow/Process/21989/3/2/7

- **Timestamp**: 22/07/2025, 6:57:54 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/7",
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
    "PageID": 7,
    "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_6of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 6</strong> of 12</h6><p></p><h4><strong>Answer according to the way you prefer to work</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>",
    "Description": "TMPQ - Page 06",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 30,
        "IsForm": false,
        "Description": "Question 26",
        "Prompt": "26)",
        "Number": "26",
        "StatementA": "I emphasise getting ideas",
        "StatementB": "I emphasise getting facts",
        "Index": 0,
        "SortOrder": 4,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 31,
        "IsForm": false,
        "Description": "Question 27",
        "Prompt": "27)",
        "Number": "27",
        "StatementA": "I usually let my heart rule my head",
        "StatementB": "I usually let my head rule my heart",
        "Index": 0,
        "SortOrder": 5,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 32,
        "IsForm": false,
        "Description": "Question 28",
        "Prompt": "28)",
        "Number": "28",
        "StatementA": "Attention to detail is the most important part of the work process",
        "StatementB": "Attention to creativity is the most important part of the work process",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 33,
        "IsForm": false,
        "Description": "Question 29",
        "Prompt": "29)",
        "Number": "29",
        "StatementA": "I think I am basically a person of reason",
        "StatementB": "I feel basically I tend to rely on my own opinions and views",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 34,
        "IsForm": false,
        "Description": "Question 30",
        "Prompt": "30)",
        "Number": "30",
        "StatementA": "I prefer to work in depth on a few issues at a time",
        "StatementB": "I prefer to work widely with many issues at a time",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      }
    ],
    "BaseContentID": 3,
    "CurrentSectionID": 2,
    "NextPageID": 8,
    "CurrentPageID": 7,
    "PreviousPageID": 6,
    "SubscriptionID": 21989,
    "NextBaseContentID": 79,
    "PreviousBaseContentID": 85
  }
}
```

---

### 11. GET https://localhost:8001/Workflow/Process/21989/3/2/8

- **Timestamp**: 22/07/2025, 6:58:04 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/8",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 12. GET https://localhost:8001/Workflow/Process/21989/3/2/8

- **Timestamp**: 22/07/2025, 6:58:04 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/8",
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
    "PageID": 8,
    "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_7of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 7</strong> of 12</h6><p></p><h4><strong>Answer according to the way you prefer to work</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>",
    "Description": "TMPQ - Page 07",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 35,
        "IsForm": false,
        "Description": "Question 31",
        "Prompt": "31)",
        "Number": "31",
        "StatementA": "I ask 'Is it fair?'",
        "StatementB": "I ask 'Will it work?'",
        "Index": 0,
        "SortOrder": 4,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 36,
        "IsForm": false,
        "Description": "Question 32",
        "Prompt": "32)",
        "Number": "32",
        "StatementA": "I rarely allow deadlines to be altered",
        "StatementB": "I often allow deadlines to be altered",
        "Index": 0,
        "SortOrder": 5,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 37,
        "IsForm": false,
        "Description": "Question 33",
        "Prompt": "33)",
        "Number": "33",
        "StatementA": "I prefer to work on tasks where I can use my existing skills",
        "StatementB": "I prefer to work on opportunities where I have to develop new skills",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 38,
        "IsForm": false,
        "Description": "Question 34",
        "Prompt": "34)",
        "Number": "34",
        "StatementA": "When under pressure I prefer to have time for myself to think things through",
        "StatementB": "When under pressure I prefer to meet with others to talk things through",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 39,
        "IsForm": false,
        "Description": "Question 35",
        "Prompt": "35)",
        "Number": "35",
        "StatementA": "I prefer to take things as they come",
        "StatementB": "I prefer to work to a clear schedule",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      }
    ],
    "BaseContentID": 3,
    "CurrentSectionID": 2,
    "NextPageID": 9,
    "CurrentPageID": 8,
    "PreviousPageID": 7,
    "SubscriptionID": 21989,
    "NextBaseContentID": 79,
    "PreviousBaseContentID": 85
  }
}
```

---

### 13. GET https://localhost:8001/Workflow/Process/21989/3/2/9

- **Timestamp**: 22/07/2025, 6:58:14 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/9",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 14. GET https://localhost:8001/Workflow/Process/21989/3/2/9

- **Timestamp**: 22/07/2025, 6:58:14 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/9",
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
    "PageID": 9,
    "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_8of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 8</strong> of 12</h6><p></p><h4><strong>Answer according to the way you prefer to work</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>",
    "Description": "TMPQ - Page 08",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 40,
        "IsForm": false,
        "Description": "Question 36",
        "Prompt": "36)",
        "Number": "36",
        "StatementA": "Solutions become clearer to me when I relate them to my beliefs",
        "StatementB": "Solutions become clearer to me when I relate them to the facts",
        "Index": 0,
        "SortOrder": 4,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 41,
        "IsForm": false,
        "Description": "Question 37",
        "Prompt": "37)",
        "Number": "37",
        "StatementA": "I usually see the whole problem but often miss the details",
        "StatementB": "I usually do well with the details of a problem but often find it difficult to see the 'complete picture'",
        "Index": 0,
        "SortOrder": 5,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 42,
        "IsForm": false,
        "Description": "Question 38",
        "Prompt": "38)",
        "Number": "38",
        "StatementA": "I speak a lot and this helps me think",
        "StatementB": "I think a lot before I speak",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 43,
        "IsForm": false,
        "Description": "Question 39",
        "Prompt": "39)",
        "Number": "39",
        "StatementA": "Under pressure, reason must come before personal principles",
        "StatementB": "Under pressure, personal principles must come before reason",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 44,
        "IsForm": false,
        "Description": "Question 40",
        "Prompt": "40)",
        "Number": "40",
        "StatementA": "I like to experiment with new ways of doing things",
        "StatementB": "I like to solve problems in a practical, systematic way",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      }
    ],
    "BaseContentID": 3,
    "CurrentSectionID": 2,
    "NextPageID": 10,
    "CurrentPageID": 9,
    "PreviousPageID": 8,
    "SubscriptionID": 21989,
    "NextBaseContentID": 79,
    "PreviousBaseContentID": 85
  }
}
```

---

### 15. GET https://localhost:8001/Workflow/Process/21989/3/2/10

- **Timestamp**: 22/07/2025, 6:58:25 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/10",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 16. GET https://localhost:8001/Workflow/Process/21989/3/2/10

- **Timestamp**: 22/07/2025, 6:58:25 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/10",
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
    "PageID": 10,
    "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_9of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 9</strong> of 12</h6><p></p><h4><strong>Which word in each pair best describes you?</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>",
    "Description": "TMPQ - Page 09",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 45,
        "IsForm": false,
        "Description": "Question 41",
        "Prompt": "41)",
        "Number": "41",
        "StatementA": "Persuade",
        "StatementB": "Consider",
        "Index": 0,
        "SortOrder": 4,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 46,
        "IsForm": false,
        "Description": "Question 42",
        "Prompt": "42)",
        "Number": "42",
        "StatementA": "Future",
        "StatementB": "Present",
        "Index": 0,
        "SortOrder": 5,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 47,
        "IsForm": false,
        "Description": "Question 43",
        "Prompt": "43)",
        "Number": "43",
        "StatementA": "Question",
        "StatementB": "Faith",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 48,
        "IsForm": false,
        "Description": "Question 44",
        "Prompt": "44)",
        "Number": "44",
        "StatementA": "Imagination",
        "StatementB": "Commonsense",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 49,
        "IsForm": false,
        "Description": "Question 45",
        "Prompt": "45)",
        "Number": "45",
        "StatementA": "Orderly",
        "StatementB": "Flexible",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      }
    ],
    "BaseContentID": 3,
    "CurrentSectionID": 2,
    "NextPageID": 11,
    "CurrentPageID": 10,
    "PreviousPageID": 9,
    "SubscriptionID": 21989,
    "NextBaseContentID": 79,
    "PreviousBaseContentID": 85
  }
}
```

---

### 17. GET https://localhost:8001/Workflow/Process/21989/3/2/11

- **Timestamp**: 22/07/2025, 6:58:35 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/11",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 18. GET https://localhost:8001/Workflow/Process/21989/3/2/11

- **Timestamp**: 22/07/2025, 6:58:35 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/11",
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
    "PageID": 11,
    "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_10of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 10</strong> of 12</h6><p></p><h4><strong>Which word in each pair best describes you?</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>",
    "Description": "TMPQ - Page 10",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 50,
        "IsForm": false,
        "Description": "Question 46",
        "Prompt": "46)",
        "Number": "46",
        "StatementA": "Production",
        "StatementB": "Research",
        "Index": 0,
        "SortOrder": 4,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 51,
        "IsForm": false,
        "Description": "Question 47",
        "Prompt": "47)",
        "Number": "47",
        "StatementA": "Belief",
        "StatementB": "Reason",
        "Index": 0,
        "SortOrder": 5,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 52,
        "IsForm": false,
        "Description": "Question 48",
        "Prompt": "48)",
        "Number": "48",
        "StatementA": "Concentration",
        "StatementB": "Variety",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 53,
        "IsForm": false,
        "Description": "Question 49",
        "Prompt": "49)",
        "Number": "49",
        "StatementA": "Facts",
        "StatementB": "Principles",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 54,
        "IsForm": false,
        "Description": "Question 50",
        "Prompt": "50)",
        "Number": "50",
        "StatementA": "Talkative",
        "StatementB": "Quiet",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      }
    ],
    "BaseContentID": 3,
    "CurrentSectionID": 2,
    "NextPageID": 12,
    "CurrentPageID": 11,
    "PreviousPageID": 10,
    "SubscriptionID": 21989,
    "NextBaseContentID": 79,
    "PreviousBaseContentID": 85
  }
}
```

---

### 19. GET https://localhost:8001/Workflow/Process/21989/3/2/12

- **Timestamp**: 22/07/2025, 6:58:48 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/12",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 20. GET https://localhost:8001/Workflow/Process/21989/3/2/12

- **Timestamp**: 22/07/2025, 6:58:48 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/12",
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
    "PageID": 12,
    "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_11of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 11</strong> of 12</h6><p></p><h4><strong>Which word in each pair best describes you?</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>",
    "Description": "TMPQ - Page 11",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 55,
        "IsForm": false,
        "Description": "Question 51",
        "Prompt": "51)",
        "Number": "51",
        "StatementA": "Unplanned",
        "StatementB": "Planned",
        "Index": 0,
        "SortOrder": 4,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 56,
        "IsForm": false,
        "Description": "Question 52",
        "Prompt": "52)",
        "Number": "52",
        "StatementA": "Feelings",
        "StatementB": "Analysis",
        "Index": 0,
        "SortOrder": 5,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 57,
        "IsForm": false,
        "Description": "Question 53",
        "Prompt": "53)",
        "Number": "53",
        "StatementA": "Creative",
        "StatementB": "Practical",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 58,
        "IsForm": false,
        "Description": "Question 54",
        "Prompt": "54)",
        "Number": "54",
        "StatementA": "Implement",
        "StatementB": "Support",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 59,
        "IsForm": false,
        "Description": "Question 55",
        "Prompt": "55)",
        "Number": "55",
        "StatementA": "Contemplate",
        "StatementB": "Participate",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      }
    ],
    "BaseContentID": 3,
    "CurrentSectionID": 2,
    "NextPageID": 13,
    "CurrentPageID": 12,
    "PreviousPageID": 11,
    "SubscriptionID": 21989,
    "NextBaseContentID": 79,
    "PreviousBaseContentID": 85
  }
}
```

---

### 21. GET https://localhost:8001/Workflow/Process/21989/3/2/13

- **Timestamp**: 22/07/2025, 6:58:59 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/13",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 22. GET https://localhost:8001/Workflow/Process/21989/3/2/13

- **Timestamp**: 22/07/2025, 6:58:59 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Page Navigation: Moving to next page within current section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/3/2/13",
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
    "PageID": 13,
    "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_12of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 12</strong> of 12</h6><p></p><h4><strong>Which word in each pair best describes you?</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>",
    "Description": "TMPQ - Page 12",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 60,
        "IsForm": false,
        "Description": "Question 56",
        "Prompt": "56)",
        "Number": "56",
        "StatementA": "Understand",
        "StatementB": "Decide",
        "Index": 0,
        "SortOrder": 4,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 61,
        "IsForm": false,
        "Description": "Question 57",
        "Prompt": "57)",
        "Number": "57",
        "StatementA": "Objective",
        "StatementB": "Subjective",
        "Index": 0,
        "SortOrder": 5,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 62,
        "IsForm": false,
        "Description": "Question 58",
        "Prompt": "58)",
        "Number": "58",
        "StatementA": "Build",
        "StatementB": "Design",
        "Index": 0,
        "SortOrder": 6,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 63,
        "IsForm": false,
        "Description": "Question 59",
        "Prompt": "59)",
        "Number": "59",
        "StatementA": "Careful",
        "StatementB": "Impulsive",
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 64,
        "IsForm": false,
        "Description": "Question 60",
        "Prompt": "60)",
        "Number": "60",
        "StatementA": "Action ",
        "StatementB": "Information",
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 18,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||Seesaw|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      }
    ],
    "BaseContentID": 3,
    "CurrentSectionID": 2,
    "CurrentPageID": 13,
    "PreviousPageID": 12,
    "SubscriptionID": 21989,
    "NextBaseContentID": 79,
    "PreviousBaseContentID": 85
  }
}
```

---

### 23. GET https://localhost:8001/Workflow/Process/21989/79

- **Timestamp**: 22/07/2025, 6:59:11 pm
- **Status**: PENDING
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Base Content Navigation: Moving to next major section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/79",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  }
}
```

---

### 24. GET https://localhost:8001/Workflow/Process/21989/79

- **Timestamp**: 22/07/2025, 6:59:11 pm
- **Status**: 200
- **Source**: WorkflowSubmit-Chained
- **Tool**: tms_get_workflow_process
- **Description**: Base Content Navigation: Moving to next major section

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/Workflow/Process/21989/79",
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
    "PageID": 396,
    "Overview": "<div class=\"spacer50\" style=\"margin-left:0px;\"><h4>You're almost done!</h4></div><div class=\"spacer25\" style=\"margin-left:0px;\">Mary, before you submit your responses, we would like to ask you a few more questions that will help us with our ongoing research program.<p></p><p>This will enable us to create better solutions for all clients of Team Management Systems and support our ongoing development of worldwide norm data.</p><p></p><p>Your participation is valuable to us, and we thank you in advance for this information.</p></div><div class=\"spacer25\"></div>",
    "Description": "Consent and Research",
    "Questions": [
      {
        "ID": 0,
        "QuestionID": 2746,
        "IsForm": true,
        "Description": "Research Participation",
        "Prompt": "Would you like to participate in the Team Management Systems research program?",
        "Index": 0,
        "SortOrder": 1,
        "IsEnabled": true,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 8,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||YesNo|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 2747,
        "IsForm": true,
        "Description": "Data Privacy Para",
        "Prompt": "HTML",
        "HTMLText": "   <div class=\"spacer50 c1\">\r\n            <br>\r\n            <h4>Research Consent Statement</h4>\r\n            <br>\r\n            <p>I understand that the research questions are voluntary, and I agree to have any response that I provide to the research questions included in the Team Management Systems worldwide research database along with my questionnaire responses.</p>\r\n            <p>Team Management Systems guarantees that my name will not be included in the research database and that access to the worldwide database is restricted to Team Management Systems research personnel only.</p>\r\n            <p>I am aware of the \r\n            <a href=\"https://www.teammanagementsystems.com/policies-and-terms/privacy-policies/\" target=\"_blank\">privacy policies</a> where I may find more details on the processing of my personal data. I know that I am neither required to consent nor to provide any information here. In case I do not consent, my personal data will not be subject to Team Management Services research activities. There will be no other consequences. I am aware that I may withdraw consent at any time with effect for any future data processing by declaration to\r\n            <a href=\"mailto:info@teammanagementsystems.com\">Team Management Systems.</a></p>\r\n        </div>",
        "Index": 0,
        "SortOrder": 2,
        "IsEnabled": false,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 20,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||HTML|False",
        "IsRequired": false,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 2748,
        "IsForm": true,
        "Description": "Data Privacy Statement",
        "Prompt": "I have read and accept the Research Consent Statement",
        "Index": 0,
        "SortOrder": 3,
        "IsEnabled": false,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 8,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||YesNo|False",
        "IsRequired": true,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 2752,
        "IsForm": true,
        "Description": "Profession",
        "Prompt": "Profession",
        "MinLength": 1,
        "MaxLength": 50,
        "Index": 0,
        "SortOrder": 7,
        "IsEnabled": false,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 6,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||1|50|TextField|False",
        "IsRequired": false,
        "ColumnWidth": 5,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 2753,
        "IsForm": true,
        "Description": "Country of nationality",
        "Prompt": "Country of nationality",
        "MinLength": 1,
        "MaxLength": 50,
        "Index": 0,
        "SortOrder": 8,
        "IsEnabled": false,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 6,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||1|50|TextField|False",
        "IsRequired": false,
        "ColumnWidth": 5,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 2754,
        "IsForm": true,
        "Description": "Country where you work",
        "Prompt": "Country where you work",
        "MinLength": 1,
        "MaxLength": 50,
        "Index": 0,
        "SortOrder": 9,
        "IsEnabled": false,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 6,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||1|50|TextField|False",
        "IsRequired": false,
        "ColumnWidth": 5,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 2755,
        "IsForm": true,
        "Description": "Country of residence",
        "Prompt": "Country of residence",
        "MinLength": 1,
        "MaxLength": 50,
        "Index": 0,
        "SortOrder": 10,
        "IsEnabled": false,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 6,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||1|50|TextField|False",
        "IsRequired": false,
        "ColumnWidth": 5,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 2756,
        "IsForm": true,
        "Description": "Country where you spent most time up to age 20",
        "Prompt": "Country where you spent most time up to age 20",
        "MinLength": 1,
        "MaxLength": 50,
        "Index": 0,
        "SortOrder": 11,
        "IsEnabled": false,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 6,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||1|50|TextField|False",
        "IsRequired": false,
        "ColumnWidth": 5,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false
      },
      {
        "ID": 0,
        "QuestionID": 2757,
        "IsForm": true,
        "Description": "What is your level?",
        "Prompt": "What is your level?",
        "Index": 0,
        "SortOrder": 12,
        "IsEnabled": false,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 4,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||DropDownList|False",
        "IsRequired": false,
        "ColumnWidth": 5,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false,
        "ListValues": [
          "0",
          "1",
          "2",
          "3"
        ],
        "ListOptions": [
          "Top Manager/Leader",
          "Middle Manager/Leader",
          "Front Line Manager/Leader",
          "Team Member"
        ]
      },
      {
        "ID": 0,
        "QuestionID": 2758,
        "IsForm": true,
        "Description": "What is your functional area",
        "Prompt": "What is your functional area?",
        "Index": 0,
        "SortOrder": 13,
        "IsEnabled": false,
        "AllowMultipleSelections": false,
        "ForceUpperCase": false,
        "Type": 4,
        "AnswerBoolean": false,
        "AnswerMultiple": [],
        "Validation": "||||DropDownList|False",
        "IsRequired": false,
        "ColumnWidth": 5,
        "AllowNegative": false,
        "KeepWithNext": false,
        "KeepWithNextItemised": false,
        "UseHorizontalLayout": false,
        "ListValues": [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8"
        ],
        "ListOptions": [
          "CEO/Managing Director",
          "Corporate Planning/Development",
          "Personnel/Training/HR",
          "Finance/Accounting",
          "Sales/Marketing/PR",
          "Production/Construction/Control",
          "Design/R&D",
          "Consultancy",
          "Administration"
        ]
      }
    ],
    "BaseContentID": 79,
    "CurrentSectionID": 81,
    "CurrentPageID": 396,
    "SubscriptionID": 21989,
    "PreviousBaseContentID": 3
  }
}
```

---

## General API Calls

### 1. GET https://localhost:8001/api/v1/workflow/process?subscriptionId=21989

- **Timestamp**: 22/07/2025, 6:56:16 pm
- **Status**: PENDING
- **Source**: MCP-Optimized
- **Tool**: tms_get_workflow_process

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/api/v1/workflow/process?subscriptionId=21989",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionId": 21989
  }
}
```

---

### 2. GET https://localhost:8001/api/v1/workflow/process?subscriptionId=21989&baseContentId=3

- **Timestamp**: 22/07/2025, 6:56:42 pm
- **Status**: PENDING
- **Source**: MCP-Optimized
- **Tool**: tms_get_workflow_process

**Request:**
```json
{
  "method": "GET",
  "url": "https://localhost:8001/api/v1/workflow/process?subscriptionId=21989&baseContentId=3",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWFyeS5hbGxlbkB6YXBob3JpYS5jb20iLCJuYW1laWQiOiIxMTMyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCIsInJlc3BvbmRlbnRJRCI6IjExMzIzIiwibGFzdE1vZGlmaWVkIjoiMTMzOTc2MjcyODQ0MDM5ODMwIiwibW9iaWxlQXBwVHlwZSI6IldlYiIsIm5iZiI6MTc1MzE3OTI0NCwiZXhwIjoxNzg0NzE1MjQ0LCJpYXQiOjE3NTMxNzkyNDQsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.1CUpZSzkqLG1-n2YAvQc9BJAlpCA2jqVrIxLg7j5W3c"
  },
  "data": {
    "subscriptionId": 21989,
    "baseContentId": 3
  }
}
```

---

### 3. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:57:06 pm
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
    "subscriptionID": 21989,
    "pageID": 2,
    "currentPageID": 2,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 3,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 5,
        "value": "20"
      },
      {
        "questionID": 6,
        "value": "02"
      },
      {
        "questionID": 7,
        "value": "02"
      },
      {
        "questionID": 8,
        "value": "20"
      },
      {
        "questionID": 9,
        "value": "02"
      },
      {
        "questionID": 1041,
        "value": "Amazon"
      }
    ]
  }
}
```

---

### 4. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:57:06 pm
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
    "subscriptionID": 21989,
    "pageID": 2,
    "currentPageID": 2,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 3,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 5,
        "value": "20"
      },
      {
        "questionID": 6,
        "value": "02"
      },
      {
        "questionID": 7,
        "value": "02"
      },
      {
        "questionID": 8,
        "value": "20"
      },
      {
        "questionID": 9,
        "value": "02"
      },
      {
        "questionID": 1041,
        "value": "Amazon"
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

### 5. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:57:21 pm
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
    "subscriptionID": 21989,
    "pageID": 3,
    "currentPageID": 3,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 4,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 10,
        "value": "20"
      },
      {
        "questionID": 11,
        "value": "21"
      },
      {
        "questionID": 12,
        "value": "12"
      },
      {
        "questionID": 13,
        "value": "20"
      },
      {
        "questionID": 14,
        "value": "02"
      }
    ]
  }
}
```

---

### 6. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:57:22 pm
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
    "subscriptionID": 21989,
    "pageID": 3,
    "currentPageID": 3,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 4,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 10,
        "value": "20"
      },
      {
        "questionID": 11,
        "value": "21"
      },
      {
        "questionID": 12,
        "value": "12"
      },
      {
        "questionID": 13,
        "value": "20"
      },
      {
        "questionID": 14,
        "value": "02"
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

### 7. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:57:32 pm
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
    "subscriptionID": 21989,
    "pageID": 4,
    "currentPageID": 4,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 5,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 15,
        "value": "20"
      },
      {
        "questionID": 16,
        "value": "02"
      },
      {
        "questionID": 17,
        "value": "20"
      },
      {
        "questionID": 18,
        "value": "21"
      },
      {
        "questionID": 19,
        "value": "02"
      }
    ]
  }
}
```

---

### 8. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:57:32 pm
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
    "subscriptionID": 21989,
    "pageID": 4,
    "currentPageID": 4,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 5,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 15,
        "value": "20"
      },
      {
        "questionID": 16,
        "value": "02"
      },
      {
        "questionID": 17,
        "value": "20"
      },
      {
        "questionID": 18,
        "value": "21"
      },
      {
        "questionID": 19,
        "value": "02"
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

### 9. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:57:43 pm
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
    "subscriptionID": 21989,
    "pageID": 5,
    "currentPageID": 5,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 6,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 20,
        "value": "20"
      },
      {
        "questionID": 21,
        "value": "21"
      },
      {
        "questionID": 22,
        "value": "20"
      },
      {
        "questionID": 23,
        "value": "02"
      },
      {
        "questionID": 24,
        "value": "02"
      }
    ]
  }
}
```

---

### 10. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:57:43 pm
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
    "subscriptionID": 21989,
    "pageID": 5,
    "currentPageID": 5,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 6,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 20,
        "value": "20"
      },
      {
        "questionID": 21,
        "value": "21"
      },
      {
        "questionID": 22,
        "value": "20"
      },
      {
        "questionID": 23,
        "value": "02"
      },
      {
        "questionID": 24,
        "value": "02"
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

### 11. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:57:54 pm
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
    "subscriptionID": 21989,
    "pageID": 6,
    "currentPageID": 6,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 7,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 25,
        "value": "20"
      },
      {
        "questionID": 26,
        "value": "21"
      },
      {
        "questionID": 27,
        "value": "02"
      },
      {
        "questionID": 28,
        "value": "20"
      },
      {
        "questionID": 29,
        "value": "21"
      }
    ]
  }
}
```

---

### 12. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:57:54 pm
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
    "subscriptionID": 21989,
    "pageID": 6,
    "currentPageID": 6,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 7,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 25,
        "value": "20"
      },
      {
        "questionID": 26,
        "value": "21"
      },
      {
        "questionID": 27,
        "value": "02"
      },
      {
        "questionID": 28,
        "value": "20"
      },
      {
        "questionID": 29,
        "value": "21"
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

### 13. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:04 pm
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
    "subscriptionID": 21989,
    "pageID": 7,
    "currentPageID": 7,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 8,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 30,
        "value": "20"
      },
      {
        "questionID": 31,
        "value": "02"
      },
      {
        "questionID": 32,
        "value": "20"
      },
      {
        "questionID": 33,
        "value": "21"
      },
      {
        "questionID": 34,
        "value": "02"
      }
    ]
  }
}
```

---

### 14. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:04 pm
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
    "subscriptionID": 21989,
    "pageID": 7,
    "currentPageID": 7,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 8,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 30,
        "value": "20"
      },
      {
        "questionID": 31,
        "value": "02"
      },
      {
        "questionID": 32,
        "value": "20"
      },
      {
        "questionID": 33,
        "value": "21"
      },
      {
        "questionID": 34,
        "value": "02"
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

### 15. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:14 pm
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
    "subscriptionID": 21989,
    "pageID": 8,
    "currentPageID": 8,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 9,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 35,
        "value": "20"
      },
      {
        "questionID": 36,
        "value": "21"
      },
      {
        "questionID": 37,
        "value": "12"
      },
      {
        "questionID": 38,
        "value": "02"
      },
      {
        "questionID": 39,
        "value": "12"
      }
    ]
  }
}
```

---

### 16. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:14 pm
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
    "subscriptionID": 21989,
    "pageID": 8,
    "currentPageID": 8,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 9,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 35,
        "value": "20"
      },
      {
        "questionID": 36,
        "value": "21"
      },
      {
        "questionID": 37,
        "value": "12"
      },
      {
        "questionID": 38,
        "value": "02"
      },
      {
        "questionID": 39,
        "value": "12"
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

### 17. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:25 pm
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
    "subscriptionID": 21989,
    "pageID": 9,
    "currentPageID": 9,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 10,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 40,
        "value": "02"
      },
      {
        "questionID": 41,
        "value": "12"
      },
      {
        "questionID": 42,
        "value": "21"
      },
      {
        "questionID": 43,
        "value": "20"
      },
      {
        "questionID": 44,
        "value": "21"
      }
    ]
  }
}
```

---

### 18. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:25 pm
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
    "subscriptionID": 21989,
    "pageID": 9,
    "currentPageID": 9,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 10,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 40,
        "value": "02"
      },
      {
        "questionID": 41,
        "value": "12"
      },
      {
        "questionID": 42,
        "value": "21"
      },
      {
        "questionID": 43,
        "value": "20"
      },
      {
        "questionID": 44,
        "value": "21"
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

### 19. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:35 pm
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
    "subscriptionID": 21989,
    "pageID": 10,
    "currentPageID": 10,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 11,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 45,
        "value": "20"
      },
      {
        "questionID": 46,
        "value": "21"
      },
      {
        "questionID": 47,
        "value": "02"
      },
      {
        "questionID": 48,
        "value": "20"
      },
      {
        "questionID": 49,
        "value": "21"
      }
    ]
  }
}
```

---

### 20. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:35 pm
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
    "subscriptionID": 21989,
    "pageID": 10,
    "currentPageID": 10,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 11,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 45,
        "value": "20"
      },
      {
        "questionID": 46,
        "value": "21"
      },
      {
        "questionID": 47,
        "value": "02"
      },
      {
        "questionID": 48,
        "value": "20"
      },
      {
        "questionID": 49,
        "value": "21"
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

### 21. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:48 pm
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
    "subscriptionID": 21989,
    "pageID": 11,
    "currentPageID": 11,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 12,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 50,
        "value": "02"
      },
      {
        "questionID": 51,
        "value": "20"
      },
      {
        "questionID": 52,
        "value": "20"
      },
      {
        "questionID": 53,
        "value": "12"
      },
      {
        "questionID": 54,
        "value": "12"
      }
    ]
  }
}
```

---

### 22. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:48 pm
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
    "subscriptionID": 21989,
    "pageID": 11,
    "currentPageID": 11,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 12,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 50,
        "value": "02"
      },
      {
        "questionID": 51,
        "value": "20"
      },
      {
        "questionID": 52,
        "value": "20"
      },
      {
        "questionID": 53,
        "value": "12"
      },
      {
        "questionID": 54,
        "value": "12"
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

### 23. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:59 pm
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
    "subscriptionID": 21989,
    "pageID": 12,
    "currentPageID": 12,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 13,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 55,
        "value": "20"
      },
      {
        "questionID": 56,
        "value": "21"
      },
      {
        "questionID": 57,
        "value": "12"
      },
      {
        "questionID": 58,
        "value": "12"
      },
      {
        "questionID": 59,
        "value": "02"
      }
    ]
  }
}
```

---

### 24. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:58:59 pm
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
    "subscriptionID": 21989,
    "pageID": 12,
    "currentPageID": 12,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": 13,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 55,
        "value": "20"
      },
      {
        "questionID": 56,
        "value": "21"
      },
      {
        "questionID": 57,
        "value": "12"
      },
      {
        "questionID": 58,
        "value": "12"
      },
      {
        "questionID": 59,
        "value": "02"
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

### 25. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:59:11 pm
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
    "subscriptionID": 21989,
    "pageID": 13,
    "currentPageID": 13,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": null,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 60,
        "value": "20"
      },
      {
        "questionID": 61,
        "value": "21"
      },
      {
        "questionID": 62,
        "value": "21"
      },
      {
        "questionID": 63,
        "value": "02"
      },
      {
        "questionID": 64,
        "value": "12"
      }
    ]
  }
}
```

---

### 26. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:59:11 pm
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
    "subscriptionID": 21989,
    "pageID": 13,
    "currentPageID": 13,
    "currentSectionID": 2,
    "baseContentID": 3,
    "nextPageID": null,
    "nextSectionID": null,
    "nextBaseContentID": 79,
    "questions": [
      {
        "questionID": 60,
        "value": "20"
      },
      {
        "questionID": 61,
        "value": "21"
      },
      {
        "questionID": 62,
        "value": "21"
      },
      {
        "questionID": 63,
        "value": "02"
      },
      {
        "questionID": 64,
        "value": "12"
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

### 27. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:59:24 pm
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
    "subscriptionID": 21989,
    "pageID": 396,
    "currentPageID": 396,
    "currentSectionID": 81,
    "baseContentID": 79,
    "nextPageID": null,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 2746,
        "value": "No"
      }
    ]
  }
}
```

---

### 28. POST https://localhost:8001/Workflow/Update

- **Timestamp**: 22/07/2025, 6:59:25 pm
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
    "subscriptionID": 21989,
    "pageID": 396,
    "currentPageID": 396,
    "currentSectionID": 81,
    "baseContentID": 79,
    "nextPageID": null,
    "nextSectionID": null,
    "nextBaseContentID": null,
    "questions": [
      {
        "questionID": 2746,
        "value": "No"
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

### 29. POST https://localhost:8001/api/mcp/tms_get_workflow_process

- **Timestamp**: 22/07/2025, 6:56:16 pm
- **Status**: 200
- **Source**: MCP
- **Tool**: tms_get_workflow_process

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/api/mcp/tms_get_workflow_process",
  "data": {
    "subscriptionId": 21989
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
      "PageID": 403,
      "Overview": "<div class=\"d-md-none\"><p></p><div class=\"alert alert-danger\" role=\"alert\"><p align=\"center\"><b>!! CAUTION !!</b></p><p align=\"center\">For an optimized mobile experience and to ensure the accuracy of your results, please download the TMS Global app.</p><p align=\"center\"><a href=\"https://play.google.com/store/apps/details?id=global.tms.aicoach.prod\"><img alt=\"Get it on Google Play\" src=\"https://tms.global/asset/Get/googleplaybadge.png\" width=\"200\"></a></p><p align=\"center\"><a href=\"https://apple.co/3tNCMCr\"><img alt=\"Download on App Store\" src=\"https://tms.global/asset/Get/appstorebadge.png\" width=\"200\"></a></p></div></div><div style=\"display:block;\"><div class=\"spacer50\"></div><div><h4>Team Management Profile Questionnaire Instructions</h4><div class=\"spacer25\"></div><p>The Team Management Profile Questionnaire is designed to measure your work preferences. Your responses to the questionnaire will be analysed to produce your personal Team Management Profile, which will provide valuable feedback on your approach to work.</p><div class=\"spacer25\"></div><p><b>Please read these instructions carefully before you begin your questionnaire.</b></p><ul><li>Please note that this is <b>not a test</b> - there are no right or wrong answers</li><li>Complete <b>ALL</b> 60 questions in <b>one sitting</b></li><li>There is <b>no set time limit for completion</b></li><li>Most people take no longer than <b>15 minutes</b></li><li>Each individual has different work preferences, so you should answer according to the way you <b>prefer to work</b>, not the way you think you ought to work or the way you currently have to work to do your job</li></ul><div class=\"spacer25\"></div><p><b>How to answer the questions.</b></p><p>Each question requires you to select from 4 options offered. You must make a choice by clicking on one of these options no matter how marginal your decision may be.</p><ul><li>If you definitely prefer the statement on the left, select 2-0</li><li>If you definitely prefer the statement on the right, select 0-2</li><li>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</li></ul><p><br></p></div></div>",
      "Description": "Overview",
      "Questions": [],
      "BaseContentID": 85,
      "CurrentSectionID": 88,
      "CurrentPageID": 403,
      "SubscriptionID": 21989,
      "NextBaseContentID": 3
    },
    "message": "Workflow process retrieved successfully",
    "navigationContext": "📋 Active Workflow: Unknown\n📍 Subscription ID: 21989\n📊 Pages Completed: 0\n\n🧭 Navigation Status:\nCurrent Page: 403\nCurrent Section: 88\nCurrent Base Content: 85\n\n✅ Next Base Content Available: 3\n\n💡 Next Action:\nTo continue the workflow, use: tms_get_workflow_process with parameters: subscriptionId: 21989, baseContentId: 3"
  }
}
```

---

### 30. POST https://localhost:8001/api/mcp/tms_get_workflow_process

- **Timestamp**: 22/07/2025, 6:56:43 pm
- **Status**: 200
- **Source**: MCP
- **Tool**: tms_get_workflow_process

**Request:**
```json
{
  "method": "POST",
  "url": "https://localhost:8001/api/mcp/tms_get_workflow_process",
  "data": {
    "subscriptionId": 21989,
    "baseContentId": 3
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
      "PageID": 2,
      "Overview": "<div style=\"margin-left: 0px;\"><h6><img src=\"https://localhost:5001/Asset/Get/PB_1of12\" height=\"20px\">&nbsp; &nbsp;<strong>Page 1</strong> of 12</h6></div><div class=\"spacer25\"></div><div><h4><strong>Answer according to the way you prefer to work</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div><div class=\"spacer25\"></div>",
      "Description": "TMPQ - Page 01",
      "Questions": [
        {
          "ID": 0,
          "QuestionID": 1041,
          "IsForm": false,
          "Description": "Organisation name",
          "Prompt": "Organisation (optional)",
          "MinLength": 1,
          "MaxLength": 50,
          "Index": 0,
          "SortOrder": 2,
          "IsEnabled": true,
          "AllowMultipleSelections": false,
          "ForceUpperCase": false,
          "Type": 6,
          "AnswerBoolean": false,
          "AnswerMultiple": [],
          "Validation": "||1|50|TextField|False",
          "IsRequired": false,
          "AllowNegative": false,
          "KeepWithNext": false,
          "KeepWithNextItemised": false,
          "UseHorizontalLayout": false
        },
        {
          "ID": 0,
          "QuestionID": 5,
          "IsForm": false,
          "Description": "Question 1",
          "Prompt": "1)",
          "Number": "1",
          "StatementA": "I like to be convinced by the facts",
          "StatementB": "I like to be convinced by people's view of what is right and wrong",
          "Index": 0,
          "SortOrder": 7,
          "IsEnabled": true,
          "AllowMultipleSelections": false,
          "ForceUpperCase": false,
          "Type": 18,
          "AnswerBoolean": false,
          "AnswerMultiple": [],
          "Validation": "||||Seesaw|False",
          "IsRequired": true,
          "AllowNegative": false,
          "KeepWithNext": false,
          "KeepWithNextItemised": false,
          "UseHorizontalLayout": false
        },
        {
          "ID": 0,
          "QuestionID": 6,
          "IsForm": false,
          "Description": "Question 2",
          "Prompt": "2)",
          "Number": "2",
          "StatementA": "I like to explore many different options even if it means delaying action",
          "StatementB": "I like to make sure that action is taken quickly to resolve problems",
          "Index": 0,
          "SortOrder": 8,
          "IsEnabled": true,
          "AllowMultipleSelections": false,
          "ForceUpperCase": false,
          "Type": 18,
          "AnswerBoolean": false,
          "AnswerMultiple": [],
          "Validation": "||||Seesaw|False",
          "IsRequired": true,
          "AllowNegative": false,
          "KeepWithNext": false,
          "KeepWithNextItemised": false,
          "UseHorizontalLayout": false
        },
        {
          "ID": 0,
          "QuestionID": 7,
          "IsForm": false,
          "Description": "Question 3",
          "Prompt": "3)",
          "Number": "3",
          "StatementA": "I like to emphasise the facts in explaining a decision as people respond best to logic and reason",
          "StatementB": "I emphasise beliefs in explaining decisions as people work harder for things they believe in",
          "Index": 0,
          "SortOrder": 9,
          "IsEnabled": true,
          "AllowMultipleSelections": false,
          "ForceUpperCase": false,
          "Type": 18,
          "AnswerBoolean": false,
          "AnswerMultiple": [],
          "Validation": "||||Seesaw|False",
          "IsRequired": true,
          "AllowNegative": false,
          "KeepWithNext": false,
          "KeepWithNextItemised": false,
          "UseHorizontalLayout": false
        },
        {
          "ID": 0,
          "QuestionID": 8,
          "IsForm": false,
          "Description": "Question 4",
          "Prompt": "4)",
          "Number": "4",
          "StatementA": "I prefer to work with as much information as possible and will not always be orderly",
          "StatementB": "I prefer to work in an orderly way so I know where things are",
          "Index": 0,
          "SortOrder": 10,
          "IsEnabled": true,
          "AllowMultipleSelections": false,
          "ForceUpperCase": false,
          "Type": 18,
          "AnswerBoolean": false,
          "AnswerMultiple": [],
          "Validation": "||||Seesaw|False",
          "IsRequired": true,
          "AllowNegative": false,
          "KeepWithNext": false,
          "KeepWithNextItemised": false,
          "UseHorizontalLayout": false
        },
        {
          "ID": 0,
          "QuestionID": 9,
          "IsForm": false,
          "Description": "Question 5",
          "Prompt": "5)",
          "Number": "5",
          "StatementA": "I prefer working on complex problems",
          "StatementB": "I prefer working on straightforward problems",
          "Index": 0,
          "SortOrder": 11,
          "IsEnabled": true,
          "AllowMultipleSelections": false,
          "ForceUpperCase": false,
          "Type": 18,
          "AnswerBoolean": false,
          "AnswerMultiple": [],
          "Validation": "||||Seesaw|False",
          "IsRequired": true,
          "AllowNegative": false,
          "KeepWithNext": false,
          "KeepWithNextItemised": false,
          "UseHorizontalLayout": false
        }
      ],
      "BaseContentID": 3,
      "CurrentSectionID": 2,
      "NextPageID": 3,
      "CurrentPageID": 2,
      "SubscriptionID": 21989,
      "NextBaseContentID": 79,
      "PreviousBaseContentID": 85
    },
    "message": "Workflow process retrieved successfully",
    "navigationContext": "📋 Active Workflow: Unknown\n📍 Subscription ID: 21989\n📊 Pages Completed: 1\n\n🧭 Navigation Status:\nCurrent Page: 2\nCurrent Section: 2\nCurrent Base Content: 3\n\n✅ Next Page Available: 3\n\n💡 Next Action:\nTo continue the workflow, use: tms_get_workflow_process with parameters: subscriptionId: 21989, baseContentId: 3, sectionId: 2, pageId: 3"
  }
}
```

---

