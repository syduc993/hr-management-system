export const useAttendanceStats = () => {
    const [stats, setStats] = useState({
        totalAttendanceLogs: 0,
        todayLogs: 0,
        thisWeekLogs: 0
    });
    const [loading, setLoading] = useState(false);
    
    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await api.get('/attendance/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching attendance stats:', error);
        } finally {
            setLoading(false);
        }
    };
    
    return { stats, loading, fetchStats };
};
