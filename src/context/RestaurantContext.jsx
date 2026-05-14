import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const RestaurantContext = createContext();

export function RestaurantProvider({ children }) {
  const [tables, setTables] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [sections, setSections] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
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

      // Fetch Waiter Calls
      const { data: callsData, error: callsError } = await supabase
        .from('waiter_calls')
        .select('*')
        .eq('request_status', 'pending')
        .order('created_at', { ascending: false });

      if (callsError) throw callsError;

      setTables(mapTables(tablesData));
      setWaitingList(mapWaitingList(waitlistData));
      setSections(sectionsData);
      setWaiterCalls(callsData);
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
        suggestion: null, // Logic for suggestion can be added later
        addedAt: item.added_at
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
    try {
      const { customerName, phoneNumber, numberOfPeople, arrivalStatus, waitlistId } = customerData;
      
      // 1. Create customer session
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

      // 2. Update table status
      const { error: tableError } = await supabase
        .from('restaurant_tables')
        .update({ status: arrivalStatus === 'seated' ? 'occupied' : 'reserved' })
        .eq('id', tableDbId);

      if (tableError) throw tableError;

      // 3. If from waitlist, update waitlist status
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
    try {
      const { error } = await supabase
        .from('waiting_list')
        .insert([{
          customer_name: customerData.customerName,
          phone_number: customerData.phoneNumber,
          guest_count: parseInt(customerData.numberOfPeople),
          preferred_section: customerData.preference,
          queue_status: 'waiting'
        }]);

      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error adding to waitlist:', err);
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
      refresh: fetchData,
      assignTable,
      addToWaitlist,
      completeWaiterCall: async (callId) => {
        await supabase.from('waiter_calls').update({ request_status: 'completed', completed_at: new Date().toISOString() }).eq('id', callId);
        await fetchData();
      }
    }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
