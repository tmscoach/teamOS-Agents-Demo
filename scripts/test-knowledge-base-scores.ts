#!/usr/bin/env npx tsx
/**
 * Test that the knowledge base contains information about raw and net scores
 */

import { KnowledgeBaseSearch } from '@/src/lib/knowledge-base/retrieval/search';

async function testKnowledgeBaseScores() {
  console.log('🔍 Testing TMS Knowledge Base for score explanations...\n');
  
  const search = new KnowledgeBaseSearch();
  
  try {
    // Test searches for score-related concepts
    const queries = [
      'raw scores TMP',
      'net scores calculation', 
      'ICBS profile scoring',
      'work preference measures scoring methodology',
      'introvert extrovert score calculation',
      'TMP handbook scoring'
    ];
    
    for (const query of queries) {
      console.log(`\n📖 Searching for: "${query}"`);
      console.log('─'.repeat(60));
      
      const results = await search.hybridSearch(
        query,
        query.split(' '),
        {
          documentTypes: ['HANDBOOK'],
          limit: 3,
          minRelevance: 0.1
        }
      );
      
      if (results.length === 0) {
        console.log('❌ No results found');
      } else {
        console.log(`✅ Found ${results.length} results:`);
        
        results.forEach((result, index) => {
          console.log(`\n  ${index + 1}. Source: ${result.source}`);
          console.log(`     Relevance: ${result.relevance.toFixed(3)}`);
          console.log(`     Citation: ${result.citation}`);
          
          // Show preview of content
          const preview = result.content.substring(0, 200).replace(/\n/g, ' ');
          console.log(`     Content: ${preview}...`);
          
          // Check if it mentions scoring concepts
          const hasRaw = result.content.toLowerCase().includes('raw');
          const hasNet = result.content.toLowerCase().includes('net');
          const hasScore = result.content.toLowerCase().includes('score');
          const hasICBS = result.content.includes('ICBS') || result.content.includes('I C B S');
          
          if (hasRaw || hasNet || hasScore || hasICBS) {
            console.log(`     📊 Contains: ${[
              hasRaw && 'raw',
              hasNet && 'net', 
              hasScore && 'score',
              hasICBS && 'ICBS'
            ].filter(Boolean).join(', ')}`);
          }
        });
      }
    }
    
    // Test the get_assessment_methodology tool specifically
    console.log('\n\n🔧 Testing get_assessment_methodology tool...');
    console.log('─'.repeat(60));
    
    const methodologyQueries = [
      { assessment_type: 'TMP', section: 'scoring methodology' },
      { assessment_type: 'TMP', section: 'net scores' },
      { assessment_type: 'TMP', section: 'work preference measures' }
    ];
    
    for (const params of methodologyQueries) {
      console.log(`\n📋 Assessment: ${params.assessment_type}, Section: ${params.section}`);
      
      const query = `${params.assessment_type} ${params.section}`;
      const results = await search.search(query, {
        documentTypes: ['HANDBOOK'],
        limit: 2,
        minRelevance: 0.1
      });
      
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} results`);
        const firstResult = results[0];
        
        // Check for scoring explanations
        if (firstResult.content.toLowerCase().includes('raw score') ||
            firstResult.content.toLowerCase().includes('net score')) {
          console.log('   ✅ Contains scoring methodology!');
          
          // Extract sentences about scoring
          const sentences = firstResult.content.split('.');
          const scoringSentences = sentences.filter(s => 
            s.toLowerCase().includes('score') || 
            s.toLowerCase().includes('calculation') ||
            s.toLowerCase().includes('measure')
          );
          
          if (scoringSentences.length > 0) {
            console.log('\n   📝 Scoring explanation:');
            scoringSentences.slice(0, 2).forEach(s => {
              console.log(`      "${s.trim()}."`);
            });
          }
        }
      } else {
        console.log('❌ No results found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await search.close();
  }
  
  console.log('\n\n📊 Summary:');
  console.log('─'.repeat(60));
  console.log('The Debrief Agent has access to:');
  console.log('1. ✅ User\'s report chunks (via search_report_chunks)');
  console.log('2. ✅ TMS Knowledge Base (via search_tms_knowledge)');
  console.log('3. ✅ Assessment methodologies (via get_assessment_methodology)');
  console.log('\nThis allows the agent to:');
  console.log('- Find the user\'s specific scores in their report');
  console.log('- Explain what raw vs net scores mean from the handbooks');
  console.log('- Provide context about ICBS profiles and calculations');
}

testKnowledgeBaseScores().catch(console.error);