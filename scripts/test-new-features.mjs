#!/usr/bin/env node

/**
 * Test New Features
 * Script untuk test fitur-fitur baru yang ditambahkan
 */

const BASE_URL = 'http://localhost:3001';

async function testNewFeatures() {
  console.log('🧪 Testing New Features...\n');

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '6281234567890',
        name: 'Admin Haisa WA'
      }),
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0];
    console.log('✅ Admin login successful');

    // Step 2: Test payment rejection
    console.log('\n2. Testing payment rejection...');
    
    // First get pending payments
    const pendingResponse = await fetch(`${BASE_URL}/api/payments/pending-list`, {
      headers: { 'Cookie': sessionCookie },
    });
    const pendingData = await pendingResponse.json();
    
    if (pendingData.pendingPayments.length > 0) {
      const payment = pendingData.pendingPayments[0];
      
      const rejectResponse = await fetch(`${BASE_URL}/api/payments/manual-reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': sessionCookie 
        },
        body: JSON.stringify({
          paymentId: payment.id,
          orderId: payment.orderId,
          notes: 'Test rejection via script'
        }),
      });

      const rejectData = await rejectResponse.json();
      if (rejectResponse.ok) {
        console.log('✅ Payment rejection successful');
        console.log(`   Payment Status: ${rejectData.paymentStatus}`);
        console.log(`   Ticket Status: ${rejectData.ticketStatus}`);
      } else {
        console.log('⚠️ Payment rejection failed:', rejectData.message);
      }
    } else {
      console.log('ℹ️ No pending payments to reject');
    }

    // Step 3: Test tickets API
    console.log('\n3. Testing tickets API...');
    const ticketsResponse = await fetch(`${BASE_URL}/api/tickets`, {
      headers: { 'Cookie': sessionCookie },
    });

    const ticketsData = await ticketsResponse.json();
    if (ticketsResponse.ok) {
      console.log('✅ Tickets API successful');
      console.log(`   Total tickets: ${ticketsData.tickets.length}`);
      
      if (ticketsData.tickets.length > 0) {
        const ticket = ticketsData.tickets[0];
        console.log(`   First ticket: ${ticket.ticketNo} - ${ticket.status}`);
        
        // Test update ticket status
        console.log('\n4. Testing ticket status update...');
        const updateResponse = await fetch(`${BASE_URL}/api/tickets/update-status`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': sessionCookie 
          },
          body: JSON.stringify({
            ticketId: ticket.id,
            status: 'IN_PROGRESS',
            notes: 'Test status update via script'
          }),
        });

        const updateData = await updateResponse.json();
        if (updateResponse.ok) {
          console.log('✅ Ticket status update successful');
          console.log(`   New status: ${updateData.ticket.status}`);
        } else {
          console.log('⚠️ Ticket status update failed:', updateData.message);
        }
      }
    } else {
      console.log('⚠️ Tickets API failed:', ticketsData.message);
    }

    // Step 5: Test agents API
    console.log('\n5. Testing agents API...');
    const agentsResponse = await fetch(`${BASE_URL}/api/users/agents`, {
      headers: { 'Cookie': sessionCookie },
    });

    const agentsData = await agentsResponse.json();
    if (agentsResponse.ok) {
      console.log('✅ Agents API successful');
      console.log(`   Total agents: ${agentsData.agents.length}`);
      
      agentsData.agents.forEach((agent, index) => {
        console.log(`   ${index + 1}. ${agent.name} (${agent.phone}) - ${agent.role}`);
      });
    } else {
      console.log('⚠️ Agents API failed:', agentsData.message);
    }

    // Step 6: Test create new agent
    console.log('\n6. Testing create new agent...');
    const createAgentResponse = await fetch(`${BASE_URL}/api/users/create-agent`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': sessionCookie 
      },
      body: JSON.stringify({
        name: 'Test Agent',
        phone: '6281234567899',
        role: 'AGENT'
      }),
    });

    const createAgentData = await createAgentResponse.json();
    if (createAgentResponse.ok) {
      console.log('✅ Create agent successful');
      console.log(`   Agent: ${createAgentData.agent.name} (${createAgentData.agent.phone})`);
    } else {
      console.log('⚠️ Create agent failed:', createAgentData.message);
    }

    console.log('\n🎉 All new features tested!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testNewFeatures();