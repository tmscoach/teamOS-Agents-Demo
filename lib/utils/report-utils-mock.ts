/**
 * Mock report generation utilities for development
 */

export function generateMockSummaryHtml(reportType: string, subscriptionId: string): string {
  const summaries: Record<string, string> = {
    TMP: `
      <div class="report-summary">
        <h2>Team Management Profile Summary</h2>
        <div class="profile-overview">
          <h3>Your Work Preference Profile</h3>
          <p><strong>Major Role:</strong> Explorer-Promoter</p>
          <p><strong>Related Roles:</strong> Creator-Innovator, Assessor-Developer</p>
        </div>
        
        <div class="key-strengths">
          <h3>Key Strengths</h3>
          <ul>
            <li>Excellent at generating and promoting new ideas</li>
            <li>Strong communication and presentation skills</li>
            <li>Natural ability to inspire and motivate others</li>
            <li>Comfortable with ambiguity and change</li>
          </ul>
        </div>
        
        <div class="work-preferences">
          <h3>Work Preferences</h3>
          <p>You prefer environments that allow for creativity, flexibility, and interaction with others. You thrive when given opportunities to explore new possibilities and share your vision with the team.</p>
        </div>
        
        <div class="next-steps">
          <h3>Recommended Next Steps</h3>
          <ul>
            <li>Share your profile with your team to improve collaboration</li>
            <li>Consider assessing your team members to understand their profiles</li>
            <li>Use the insights to optimize team dynamics and performance</li>
          </ul>
        </div>
      </div>
    `,
    QO2: `
      <div class="report-summary">
        <h2>Opportunities-Obstacles Quotient Summary</h2>
        <p>Your QO2 assessment reveals how you perceive and respond to opportunities and obstacles in your work environment.</p>
      </div>
    `,
    TeamSignals: `
      <div class="report-summary">
        <h2>Team Signals 360 Summary</h2>
        <p>This 360-degree assessment provides insights into how your team perceives various aspects of team dynamics and performance.</p>
      </div>
    `
  };

  return summaries[reportType] || `
    <div class="report-summary">
      <h2>${reportType} Assessment Summary</h2>
      <p>Your assessment has been completed successfully. The detailed report provides insights into your work preferences and team dynamics.</p>
    </div>
  `;
}

export function generateMockFullHtml(reportType: string, subscriptionId: string): string {
  const reports: Record<string, string> = {
    TMP: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
          h1, h2, h3 { color: #2c3e50; }
          .section { margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .score-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
          .score-item { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .preference-scale { display: flex; justify-content: space-between; margin: 10px 0; }
          .scale-bar { height: 30px; background: linear-gradient(to right, #e74c3c, #f39c12, #2ecc71); border-radius: 15px; position: relative; }
          .scale-marker { position: absolute; top: -5px; width: 10px; height: 40px; background: #2c3e50; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Team Management Profile Report</h1>
        <p><strong>Assessment Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
        
        <div class="section">
          <h2>Your Work Preference Profile</h2>
          <div class="profile-summary">
            <p><strong>Major Role:</strong> Explorer-Promoter</p>
            <p><strong>Related Roles:</strong> Creator-Innovator (backup), Assessor-Developer (support)</p>
            <p>Your profile indicates that you are most comfortable in roles that involve exploring new ideas and promoting them to others. You have a natural ability to see possibilities and communicate them effectively.</p>
          </div>
        </div>

        <div class="section">
          <h2>Work Preference Measures</h2>
          <div class="score-grid">
            <div class="score-item">
              <h3>Extrovert vs Introvert</h3>
              <div class="preference-scale">
                <span>Introvert</span>
                <div class="scale-bar" style="width: 200px;">
                  <div class="scale-marker" style="left: 140px;"></div>
                </div>
                <span>Extrovert</span>
              </div>
              <p>Score: +7 (Moderate Extrovert)</p>
            </div>
            
            <div class="score-item">
              <h3>Practical vs Creative</h3>
              <div class="preference-scale">
                <span>Practical</span>
                <div class="scale-bar" style="width: 200px;">
                  <div class="scale-marker" style="left: 160px;"></div>
                </div>
                <span>Creative</span>
              </div>
              <p>Score: +9 (Strong Creative)</p>
            </div>
            
            <div class="score-item">
              <h3>Analytical vs Beliefs</h3>
              <div class="preference-scale">
                <span>Analytical</span>
                <div class="scale-bar" style="width: 200px;">
                  <div class="scale-marker" style="left: 120px;"></div>
                </div>
                <span>Beliefs</span>
              </div>
              <p>Score: +3 (Balanced)</p>
            </div>
            
            <div class="score-item">
              <h3>Structured vs Flexible</h3>
              <div class="preference-scale">
                <span>Structured</span>
                <div class="scale-bar" style="width: 200px;">
                  <div class="scale-marker" style="left: 150px;"></div>
                </div>
                <span>Flexible</span>
              </div>
              <p>Score: +8 (Strong Flexible)</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Team Role Contributions</h2>
          <h3>As an Explorer-Promoter, you contribute to your team by:</h3>
          <ul>
            <li><strong>Generating Ideas:</strong> You excel at brainstorming and coming up with innovative solutions to problems</li>
            <li><strong>Communicating Vision:</strong> You can articulate ideas clearly and inspire others to see the possibilities</li>
            <li><strong>Building Networks:</strong> You naturally connect with people and build relationships that benefit the team</li>
            <li><strong>Embracing Change:</strong> You help the team adapt to new situations and see change as an opportunity</li>
          </ul>
        </div>

        <div class="section">
          <h2>Areas for Development</h2>
          <p>To maximize your effectiveness as an Explorer-Promoter:</p>
          <ul>
            <li><strong>Follow Through:</strong> Partner with Thruster-Organizers to ensure ideas are implemented</li>
            <li><strong>Detail Orientation:</strong> Work with Controller-Inspectors to refine and quality-check your concepts</li>
            <li><strong>Systematic Approach:</strong> Collaborate with Concluder-Producers to create structured plans for your initiatives</li>
          </ul>
        </div>

        <div class="section">
          <h2>Working with Other Team Roles</h2>
          <h3>Best Partnerships:</h3>
          <ul>
            <li><strong>With Thruster-Organizers:</strong> They can help you turn ideas into actionable plans</li>
            <li><strong>With Controller-Inspectors:</strong> They ensure quality and attention to detail in your projects</li>
            <li><strong>With Concluder-Producers:</strong> They help you complete projects and deliver results</li>
          </ul>
          
          <h3>Potential Challenges:</h3>
          <ul>
            <li><strong>With other Explorer-Promoters:</strong> May lead to too many ideas without implementation</li>
            <li><strong>With Controller-Inspectors:</strong> Their focus on details may feel constraining to your creative process</li>
          </ul>
        </div>

        <div class="section">
          <h2>Action Plan</h2>
          <h3>Immediate Steps:</h3>
          <ol>
            <li>Share this profile with your team to improve understanding and collaboration</li>
            <li>Identify team members who complement your Explorer-Promoter style</li>
            <li>Set up regular check-ins with detail-oriented team members for your projects</li>
            <li>Create a system to track and prioritize your ideas</li>
          </ol>
          
          <h3>Long-term Development:</h3>
          <ol>
            <li>Develop skills in project management to better execute your ideas</li>
            <li>Practice active listening to balance your natural enthusiasm with others' input</li>
            <li>Build partnerships with team members who have complementary strengths</li>
          </ol>
        </div>
      </body>
      </html>
    `,
    QO2: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
          h1, h2 { color: #2c3e50; }
        </style>
      </head>
      <body>
        <h1>Opportunities-Obstacles Quotient Report</h1>
        <p>Your QO2 assessment has been completed. This report analyzes how you perceive and respond to opportunities and obstacles.</p>
      </body>
      </html>
    `,
    TeamSignals: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
          h1, h2 { color: #2c3e50; }
        </style>
      </head>
      <body>
        <h1>Team Signals 360 Report</h1>
        <p>This 360-degree feedback report provides comprehensive insights into team dynamics and performance.</p>
      </body>
      </html>
    `
  };

  return reports[reportType] || `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
      </style>
    </head>
    <body>
      <h1>${reportType} Assessment Report</h1>
      <p>Your assessment report for subscription ${subscriptionId}</p>
    </body>
    </html>
  `;
}