Respondent authentication flow:

post: https://api-test.tms.global/Authenticate

body raw json: {"RespondentEmail":"sub1@bythelight.band","RespondentPassword":"1.Teamwork!", "MobileAppType":"teamOS"}

response: {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNwb25kZW50SUQiOiI2NzkyMSIsImxhc3RNb2RpZmllZCI6IjEzMzk3NzA4MTE5OTc1OTM5NyIsIm1vYmlsZUFwcFR5cGUiOiJ0ZWFtT1MiLCJleHAiOjE3ODQ3NzE5NTgsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.2hcndV41TVTYeVTsK680QJ9HsLg3M1USBDrORgIb_dk",
    "version": "7",
    "region": "AU"
}

