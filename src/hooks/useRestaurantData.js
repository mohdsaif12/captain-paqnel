import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRestaurantData() {
  const [tables, setTables] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [sections, setSections] = useState([]);
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

      setTables(mapTables(tablesData));
      setWaitingList(waitlistData);
      setSections(sectionsData);
    } catch (err) {
      console.error('Error fetching restaurant data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mapTables = (supabaseTables) => {
    return supabaseTables.map(t => {
      const activeSession = t.customer_sessions?.find(s => s.session_status === 'active');
      
      return {
        id: `T-${t.table_number.toString().padStart(2, '0')}`,
        dbId: t.id,
        status: t.status, // available, occupied, reserved, cleaning, payment
        guest: activeSession ? activeSession.customer_name : null,
        time: activeSession ? formatWaitTime(activeSession.started_at) : '--',
        capacity: t.capacity,
        seated: activeSession ? activeSession.guest_count : 0,
        section: t.restaurant_sections?.section_name || 'General',
        server: null, // To be implemented with assigned_waiter_id
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

    // Subscribe to changes
    const tablesSubscription = supabase
      .channel('restaurant_changes')
      .on('postgres_changes', { event: '*', table: 'restaurant_tables' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'customer_sessions' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'waiting_list' }, () => fetchData())
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

  return { tables, waitingList, sections, stats, loading, error, refresh: fetchData };
}
