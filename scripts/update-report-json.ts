/**
 * Script to update existing report with JSON data
 */

import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()

async function updateReportWithJson() {
  try {
    // Sample JSON report data
    const jsonReportData = {
      subscriptionId: "21989",
      workflowType: "TMP",
      completedAt: new Date().toISOString(),
      metadata: {
        reportType: "TMP",
        version: "2.0",
        generatedBy: "TMS API v2"
      },
      sections: [
        {
          id: "major-role",
          title: "Your Major Role",
          type: "text",
          content: {
            text: "Based on your assessment results, your major role is **Creator Innovator**. This role is characterized by a strong drive for innovation, creative problem-solving, and the ability to generate new ideas and approaches.",
            subsections: [
              {
                title: "Key Strengths",
                content: "You excel at thinking outside the box, challenging conventional wisdom, and bringing fresh perspectives to team discussions."
              },
              {
                title: "Working Style",
                content: "You prefer environments that allow for experimentation and creative freedom. You thrive when given autonomy to explore new possibilities."
              }
            ]
          }
        },
        {
          id: "related-roles",
          title: "Related Roles",
          type: "visual",
          visualization: {
            type: "bar",
            data: {
              labels: ["Explorer Promoter", "Assessor Developer", "Thruster Organizer", "Concluder Producer"],
              values: [75, 60, 45, 30]
            }
          },
          content: {
            text: "Your related roles show a balanced profile with strong Explorer Promoter tendencies, complementing your Creator Innovator major role."
          }
        },
        {
          id: "team-dynamics",
          title: "Team Dynamics",
          type: "text",
          content: {
            text: "Understanding how your role interacts with others is crucial for effective teamwork.",
            subsections: [
              {
                title: "Best Collaborations",
                items: [
                  "Concluder Producers help bring your ideas to fruition",
                  "Assessor Developers can help refine and improve your concepts",
                  "Thruster Organizers provide structure to your creative process"
                ]
              },
              {
                title: "Potential Challenges",
                items: [
                  "May clash with highly structured Controller Inspectors",
                  "Could feel constrained by excessive Upholder Maintainer focus on tradition",
                  "Might struggle with detailed implementation without support"
                ]
              }
            ]
          }
        },
        {
          id: "work-preferences",
          title: "Work Preferences",
          type: "table",
          content: {
            table: {
              headers: ["Preference", "Your Score", "Team Average"],
              rows: [
                ["Autonomy", "9/10", "7/10"],
                ["Collaboration", "7/10", "8/10"],
                ["Structure", "4/10", "6/10"],
                ["Innovation", "10/10", "6/10"],
                ["Detail Focus", "5/10", "7/10"]
              ]
            }
          }
        },
        {
          id: "development-areas",
          title: "Development Opportunities",
          type: "text",
          content: {
            text: "To maximize your effectiveness as a Creator Innovator, consider these development areas:",
            subsections: [
              {
                title: "Skill Development",
                items: [
                  "Project management skills to better organize creative outputs",
                  "Presentation skills to communicate innovative ideas effectively",
                  "Basic financial literacy to assess feasibility of creative solutions"
                ]
              },
              {
                title: "Behavioral Adaptations",
                items: [
                  "Practice patience with detailed implementation phases",
                  "Develop appreciation for maintaining existing systems",
                  "Learn to document ideas systematically for team reference"
                ]
              }
            ]
          }
        }
      ]
    }

    // Find and update the report
    const report = await prisma.userReport.findFirst({
      where: {
        subscriptionId: '21989'
      }
    })

    if (report) {
      const updated = await prisma.userReport.update({
        where: { id: report.id },
        data: {
          jsonData: jsonReportData,
          processingStatus: 'COMPLETED',
          processedAt: new Date()
        }
      })
      
      console.log('✅ Report updated successfully!')
      console.log('Report ID:', updated.id)
      console.log('User ID:', updated.userId)
      console.log('Processing Status:', updated.processingStatus)
      console.log('\nJSON data has been added with', jsonReportData.sections.length, 'sections:')
      jsonReportData.sections.forEach(s => console.log('  -', s.title))
      console.log('\n🎯 Now visit: http://localhost:3000/reports/json/21989')
    } else {
      console.log('❌ No report found with subscription ID: 21989')
    }

  } catch (error) {
    console.error('❌ Error updating report:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateReportWithJson()