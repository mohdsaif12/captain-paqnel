import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockMode } from '../lib/supabase';
import { 
  tables as mockTables, 
  waitlistData as mockWaitlistData 
} from '../data/mockData';

const RestaurantContext = createContext();
export { RestaurantContext };

const defaultMockSections = [
  { id: 1, section_name: 'Darbar Area' },
  { id: 2, section_name: 'Terrace' },
  { id: 3, section_name: 'Lounge Bar' },
  { id: 4, section_name: 'VIP Cabin' }
];

const loadMockData = () => {
  let tables = localStorage.getItem('mock_tables');
  if (tables) {
    tables = JSON.parse(tables);
    let needsUpdate = false;
    tables = tables.map(t => {
      if (t.status === 'occupied' && (!t.orders || !t.sessionId)) {
        needsUpdate = true;
        const numGuests = t.seated || 4;
        return {
          ...t,
          sessionId: t.sessionId || 'session-' + t.id,
          orders: t.orders || [
            { name: 'Wagyu Beef Burger', qty: Math.max(1, Math.floor(numGuests / 2)), price: 28.00, note: 'Medium Rare' },
            { name: 'Truffle Linguine', qty: Math.max(1, Math.ceil(numGuests / 2)), price: 32.00, note: 'Extra Parmesan' },
            { name: 'House Lemonade', qty: numGuests || 1, price: 6.00, note: 'Chilled' }
          ]
        };
      }
      return t;
    });
    if (needsUpdate) {
      localStorage.setItem('mock_tables', JSON.stringify(tables));
    }
  } else {
    tables = mockTables.map(t => {
      const isOccupied = t.status === 'occupied';
      const numGuests = t.seated || 4;
      const defaultOrders = isOccupied ? [
        { name: 'Wagyu Beef Burger', qty: Math.max(1, Math.floor(numGuests / 2)), price: 28.00, note: 'Medium Rare' },
        { name: 'Truffle Linguine', qty: Math.max(1, Math.ceil(numGuests / 2)), price: 32.00, note: 'Extra Parmesan' },
        { name: 'House Lemonade', qty: numGuests || 1, price: 6.00, note: 'Chilled' }
      ] : [];
      return {
        ...t,
        dbId: t.id,
        startedAt: isOccupied ? new Date(Date.now() - 45 * 60 * 1000).toISOString() : null,
        sessionId: isOccupied ? 'session-' + t.id : null,
        orders: defaultOrders
      };
    });
    localStorage.setItem('mock_tables', JSON.stringify(tables));
  }

  let waitlist = localStorage.getItem('mock_waitlist');
  if (waitlist) {
    waitlist = JSON.parse(waitlist);
  } else {
    waitlist = mockWaitlistData.map(item => {
      const waitTimeMins = parseInt(item.waitTime) || 15;
      let notes = '';
      if (item.id === 1) notes = 'Prefers window booth view';
      if (item.id === 2) notes = 'Allergy: peanuts. Celebration dinner';
      if (item.id === 3) notes = 'Wheelchair access required';
      return {
        ...item,
        addedAt: new Date(Date.now() - waitTimeMins * 60 * 1000).toISOString(),
        notes
      };
    });
    localStorage.setItem('mock_waitlist', JSON.stringify(waitlist));
  }

  let waiterCalls = localStorage.getItem('mock_waiter_calls');
  if (waiterCalls) {
    waiterCalls = JSON.parse(waiterCalls);
  } else {
    waiterCalls = [
      {
        id: 'wc-1',
        table_id: 'T-01',
        table_number: '01',
        customer_name: 'Sarah J.',
        notes: 'Need extra napkins',
        request_type: 'Need extra napkins',
        request_status: 'pending',
        is_sos: false,
        created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString()
      },
      {
        id: 'wc-2',
        table_id: 'T-05',
        table_number: '05',
        customer_name: 'Mark V.',
        notes: 'Requesting check',
        request_type: 'Requesting check',
        request_status: 'pending',
        is_sos: false,
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString()
      },
      {
        id: 'wc-3',
        table_id: 'T-01',
        table_number: '01',
        customer_name: 'Sarah J.',
        notes: 'SOS: Service is extremely slow',
        request_type: 'SOS: Service is extremely slow',
        request_status: 'pending',
        is_sos: true,
        created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString()
      }
    ];
    localStorage.setItem('mock_waiter_calls', JSON.stringify(waiterCalls));
  }

  const sections = defaultMockSections;

  return { tables, waitlist, waiterCalls, sections };
};

export function RestaurantProvider({ children }) {
  const [tables, setTables] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [sections, setSections] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCustomerSim, setShowCustomerSim] = useState(false);

  const fetchData = async () => {
    if (isMockMode) {
      try {
        setLoading(true);
        const data = loadMockData();
        
        const now = new Date();
        const updatedTables = data.tables.map(t => {
          if (t.startedAt) {
            const start = new Date(t.startedAt);
            const diffMins = Math.floor((now - start) / 60000);
            let timeStr = '--';
            if (diffMins < 60) {
              timeStr = `${diffMins} mins`;
            } else {
              const hrs = Math.floor(diffMins / 60);
              const mins = diffMins % 60;
              timeStr = `${hrs}h ${mins}m`;
            }
            return { ...t, time: timeStr };
          }
          return t;
        });

        const updatedWaitlist = data.waitlist.map((item, index) => {
          const addedAt = new Date(item.addedAt);
          const diffMins = Math.floor((now - addedAt) / 60000);
          return {
            ...item,
            waitTime: `${diffMins}m`,
            isNext: index === 0
          };
        });

        const activeCalls = data.waiterCalls.filter(c => c.request_status === 'pending');

        updatedTables.forEach(t => {
          t.pendingCalls = activeCalls.filter(c => c.table_id === t.dbId);
          t.hasPendingCall = t.pendingCalls.length > 0;
        });

        setTables(updatedTables);
        setWaitingList(updatedWaitlist);
        setSections(data.sections);
        setWaiterCalls(activeCalls);
      } catch (err) {
        console.error('Error fetching mock data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      
      // Fetch Tables with current sessions
      const { data: tablesData, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select(`
          *,
          restaurant_sections (section_name),
          customer_sessions (
            id,
            customer_name,
            guest_count,
            session_status,
            started_at
          )
        `)
        .order('table_number');

      if (tablesError) throw tablesError;

      // Fetch Waiting List
      const { data: waitlistData, error: waitlistError } = await supabase
        .from('waiting_list')
        .select('*')
        .eq('queue_status', 'waiting')
        .order('added_at');

      if (waitlistError) throw waitlistError;

      // Fetch Sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('restaurant_sections')
        .select('*');

      if (sectionsError) throw sectionsError;

      // Fetch Waiter Calls with joined restaurant_tables to get table_number
      const { data: callsData, error: callsError } = await supabase
        .from('waiter_calls')
        .select(`
          *,
          restaurant_tables (
            table_number
          )
        `)
        .eq('request_status', 'pending')
        .order('created_at', { ascending: false });

      if (callsError) throw callsError;

      const mappedTables = mapTables(tablesData);
      const mappedCalls = mapWaiterCalls(callsData);

      mappedTables.forEach(t => {
        t.pendingCalls = mappedCalls.filter(c => c.table_id === t.dbId);
        t.hasPendingCall = t.pendingCalls.length > 0;
      });

      setTables(mappedTables);
      setWaitingList(mapWaitingList(waitlistData));
      setSections(sectionsData);
      setWaiterCalls(mappedCalls);
    } catch (err) {
      console.error('Error fetching restaurant data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mapWaitingList = (data) => {
    return data.map((item, index) => {
      const addedAt = new Date(item.added_at);
      const now = new Date();
      const diffMins = Math.floor((now - addedAt) / 60000);
      
      return {
        id: item.id,
        name: item.customer_name,
        people: item.guest_count,
        waitTime: `${diffMins}m`,
        preference: item.preferred_section || 'No Preference',
        isNext: index === 0,
        suggestion: null,
        addedAt: item.added_at,
        notes: item.notes || item.special_notes || item.remarks || ''
      };
    });
  };

  const mapTables = (supabaseTables) => {
    return supabaseTables.map(t => {
      const activeSession = t.customer_sessions?.find(s => s.session_status === 'active');
      
      return {
        id: `T-${t.table_number.toString().padStart(2, '0')}`,
        dbId: t.id,
        status: t.status,
        guest: activeSession ? activeSession.customer_name : null,
        time: activeSession ? formatWaitTime(activeSession.started_at) : '--',
        capacity: t.capacity,
        seated: activeSession ? activeSession.guest_count : 0,
        section: t.restaurant_sections?.section_name || 'General',
        server: null,
      };
    });
  };

  const mapWaiterCalls = (calls) => {
    return calls.map(call => ({
      ...call,
      table_number: call.restaurant_tables?.table_number || 'General',
      request_type: call.notes || 'Call Waiter',
      is_sos: call.is_sos || (call.notes && call.notes.startsWith('SOS:')) || false
    }));
  };

  const formatWaitTime = (startedAt) => {
    if (!startedAt) return '--';
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} mins`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  useEffect(() => {
    fetchData();

    if (isMockMode) {
      const interval = setInterval(() => {
        fetchData();
      }, 15000);
      return () => clearInterval(interval);
    }

    const tablesSubscription = supabase
      .channel('restaurant_changes')
      .on('postgres_changes', { event: '*', table: 'restaurant_tables' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'customer_sessions' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'waiting_list' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'waiter_calls' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(tablesSubscription);
    };
  }, []);

  const stats = {
    totalTables: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    waiting: waitingList.length,
  };

  const assignTable = async (tableDbId, customerData) => {
    if (isMockMode) {
      try {
        const { customerName, numberOfPeople, arrivalStatus, waitlistId } = customerData;
        const data = loadMockData();
        
        data.tables = data.tables.map(t => {
          if (t.dbId === tableDbId) {
            return {
              ...t,
              status: arrivalStatus === 'seated' ? 'occupied' : 'reserved',
              guest: customerName,
              seated: parseInt(numberOfPeople),
              startedAt: new Date().toISOString(),
              time: '0 mins',
              sessionId: 'session-' + t.id,
              orders: []
            };
          }
          return t;
        });

        if (waitlistId) {
          data.waitlist = data.waitlist.filter(item => item.id !== waitlistId);
        }

        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        localStorage.setItem('mock_waitlist', JSON.stringify(data.waitlist));
        
        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error assigning table in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { customerName, phoneNumber, numberOfPeople, arrivalStatus, waitlistId } = customerData;
      
      const { data: session, error: sessionError } = await supabase
        .from('customer_sessions')
        .insert([{
          table_id: tableDbId,
          customer_name: customerName,
          phone_number: phoneNumber,
          guest_count: parseInt(numberOfPeople),
          session_status: 'active'
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: tableError } = await supabase
        .from('restaurant_tables')
        .update({ status: arrivalStatus === 'seated' ? 'occupied' : 'reserved' })
        .eq('id', tableDbId);

      if (tableError) throw tableError;

      if (waitlistId) {
        await supabase
          .from('waiting_list')
          .update({ 
            queue_status: 'assigned',
            assigned_table_id: tableDbId,
            assigned_at: new Date().toISOString()
          })
          .eq('id', waitlistId);
      }

      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error assigning table:', err);
      return { success: false, error: err.message };
    }
  };

  const addToWaitlist = async (customerData) => {
    if (isMockMode) {
      try {
        const data = loadMockData();
        const newEntry = {
          id: 'wl-' + Date.now(),
          name: customerData.customerName,
          people: parseInt(customerData.numberOfPeople),
          waitTime: '0m',
          preference: customerData.preference || 'No Preference',
          isNext: data.waitlist.length === 0,
          suggestion: null,
          addedAt: new Date().toISOString(),
          notes: customerData.specialNote || ''
        };

        data.waitlist.push(newEntry);
        localStorage.setItem('mock_waitlist', JSON.stringify(data.waitlist));

        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error adding to waitlist in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { error } = await supabase
        .from('waiting_list')
        .insert([{
          customer_name: customerData.customerName,
          phone_number: customerData.phoneNumber,
          guest_count: parseInt(customerData.numberOfPeople),
          preferred_section: customerData.preference,
          queue_status: 'waiting',
          notes: customerData.specialNote
        }]);

      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error adding to waitlist:', err);
      return { success: false, error: err.message };
    }
  };

  const createWaiterCall = async (callData) => {
    if (isMockMode) {
      try {
        const { tableNumber, customerName, message, is_sos } = callData;
        const data = loadMockData();
        
        let resolvedTableId = null;
        if (tableNumber && tableNumber.length === 36) {
          resolvedTableId = tableNumber;
        } else if (tableNumber) {
          const cleanSearchNum = String(tableNumber).replace(/^T-/, '').replace(/^0+/, '').trim();
          const found = data.tables.find(t => {
            const cleanTableNum = String(t.id).replace(/^T-/, '').replace(/^0+/, '').trim();
            return cleanTableNum === cleanSearchNum;
          });
          if (found) {
            resolvedTableId = found.dbId;
          }
        }
        
        if (!resolvedTableId && data.tables.length > 0) {
          resolvedTableId = data.tables[0].dbId;
        }

        const notesValue = is_sos ? (message.startsWith('SOS:') ? message : `SOS: ${message || 'Waiter Complain'}`) : (message || 'Call Waiter');
        const newCall = {
          id: 'wc-' + Date.now(),
          table_id: resolvedTableId,
          table_number: resolvedTableId ? String(resolvedTableId).replace(/^T-/, '') : 'General',
          customer_name: customerName || 'Guest',
          notes: notesValue,
          request_type: notesValue,
          request_status: 'pending',
          is_sos: !!is_sos,
          created_at: new Date().toISOString()
        };

        data.waiterCalls.push(newCall);
        localStorage.setItem('mock_waiter_calls', JSON.stringify(data.waiterCalls));

        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error creating waiter call in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { tableNumber, customerName, message, is_sos } = callData;
      
      let resolvedTableId = null;
      if (tableNumber && tableNumber.length === 36) {
        resolvedTableId = tableNumber;
      } else if (tableNumber) {
        const cleanSearchNum = String(tableNumber).replace(/^T-/, '').replace(/^0+/, '').trim();
        const found = tables.find(t => {
          const cleanTableNum = String(t.id).replace(/^T-/, '').replace(/^0+/, '').trim();
          return cleanTableNum === cleanSearchNum;
        });
        if (found) {
          resolvedTableId = found.dbId;
        }
      }
      
      if (!resolvedTableId && tables.length > 0) {
        resolvedTableId = tables[0].dbId;
      }

      const notesValue = is_sos ? (message.startsWith('SOS:') ? message : `SOS: ${message || 'Waiter Complain'}`) : (message || 'Call Waiter');
      const { error } = await supabase
        .from('waiter_calls')
        .insert([{
          table_id: resolvedTableId,
          customer_name: customerName || 'Guest',
          notes: notesValue,
          request_status: 'pending'
        }]);

      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error creating waiter call:', err);
      return { success: false, error: err.message };
    }
  };

  const freeTable = async (tableDbId) => {
    if (isMockMode) {
      try {
        const data = loadMockData();
        
        data.tables = data.tables.map(t => {
          if (t.dbId === tableDbId) {
            return {
              ...t,
              status: 'available',
              guest: null,
              seated: 0,
              startedAt: null,
              time: '--'
            };
          }
          return t;
        });

        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        
        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error freeing table in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { error: sessionError } = await supabase
        .from('customer_sessions')
        .update({ 
          session_status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('table_id', tableDbId)
        .eq('session_status', 'active');

      if (sessionError) throw sessionError;

      const { error: tableError } = await supabase
        .from('restaurant_tables')
        .update({ status: 'available' })
        .eq('id', tableDbId);

      if (tableError) throw tableError;

      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error freeing table:', err);
      return { success: false, error: err.message };
    }
  };

  const markBilling = async (tableDbId) => {
    if (isMockMode) {
      try {
        const data = loadMockData();
        
        data.tables = data.tables.map(t => {
          if (t.dbId === tableDbId) {
            return {
              ...t,
              status: 'payment'
            };
          }
          return t;
        });

        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        
        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error marking billing in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({ status: 'payment' })
        .eq('id', tableDbId);

      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error marking billing:', err);
      return { success: false, error: err.message };
    }
  };

  const createOrder = async (tableDbId, orderItems) => {
    if (isMockMode) {
      try {
        const data = loadMockData();
        
        data.tables = data.tables.map(t => {
          if (t.dbId === tableDbId) {
            const currentOrders = t.orders || [];
            const mergedOrders = [...currentOrders];
            
            orderItems.forEach(newItem => {
              const existing = mergedOrders.find(o => o.name === newItem.name);
              if (existing) {
                existing.qty += newItem.qty;
              } else {
                mergedOrders.push({
                  name: newItem.name,
                  qty: newItem.qty,
                  price: newItem.price,
                  note: newItem.notes || ''
                });
              }
            });

            return {
              ...t,
              status: 'occupied',
              orders: mergedOrders
            };
          }
          return t;
        });

        localStorage.setItem('mock_tables', JSON.stringify(data.tables));
        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error creating order in mock mode:', err);
        return { success: false, error: err.message };
      }
    }

    try {
      const targetTable = tables.find(t => t.dbId === tableDbId);
      const validSessionId = targetTable?.sessionId;

      if (!validSessionId) {
        throw new Error('No active session found for this table. Please seat a guest first.');
      }

      const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          session_id: validSessionId,
          order_status: 'preparing',
          subtotal,
          tax,
          total,
          table_id: tableDbId
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsToInsert = orderItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.qty,
        item_price: item.price,
        total_price: item.price * item.qty
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error creating order:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <RestaurantContext.Provider value={{ 
      tables, 
      waitingList, 
      sections, 
      stats, 
      loading, 
      error, 
      waiterCalls,
      showCustomerSim,
      setShowCustomerSim,
      refresh: fetchData,
      assignTable,
      addToWaitlist,
      createWaiterCall,
      freeTable,
      markBilling,
      createOrder,
      completeWaiterCall: async (callId) => {
        if (isMockMode) {
          try {
            const data = loadMockData();
            data.waiterCalls = data.waiterCalls.map(c => {
              if (c.id === callId) {
                return { ...c, request_status: 'completed', completed_at: new Date().toISOString() };
              }
              return c;
            });
            localStorage.setItem('mock_waiter_calls', JSON.stringify(data.waiterCalls));
            fetchData();
          } catch (err) {
            console.error('Error completing waiter call in mock mode:', err);
          }
          return;
        }

        await supabase
          .from('waiter_calls')
          .update({ request_status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', callId);
        await fetchData();
      }
    }}>
      {children}
    </RestaurantContext.Provider>
  );
}

// useRestaurant hook is in ./useRestaurant.js
