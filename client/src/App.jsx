import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import { 
  Activity, 
  Terminal, 
  CheckCircle, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Clock, 
  Wifi, 
  WifiOff, 
  Database,
  Layers,
  ChevronRight
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  // Connection states
  const [serverStatus, setServerStatus] = useState('connecting'); // 'connecting', 'online', 'warning', 'offline'
  const [dbWarning, setDbWarning] = useState(null);
  const [ping, setPing] = useState(null);
  const [uptime, setUptime] = useState(0);
  const [isDbConnected, setIsDbConnected] = useState(false);
  
  // Custom console logs state
  const [logs, setLogs] = useState([
    { id: '1', time: new Date().toLocaleTimeString(), text: 'System fully initialized in React.', type: 'system' },
    { id: '2', time: new Date().toLocaleTimeString(), text: 'Attempting production backend handshake...', type: 'info' }
  ]);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // References
  const consoleEndRef = useRef(null);

  // 1. Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // 2. Custom log helper
  const addLog = (text, type = 'info') => {
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        text,
        type
      }
    ]);
  };

  // Scroll console to bottom when new logs are added
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 3. Server Health Checker
  const checkServerHealth = async () => {
    const startTime = Date.now();
    try {
      const res = await fetch(`${API_URL}/health`);
      if (!res.ok) throw new Error('Bad response status');
      
      const data = await res.json();
      const currentPing = Date.now() - startTime;
      
      setPing(currentPing);
      setUptime(data.uptime);
      
      if (data.status === 'warning') {
        setServerStatus('warning');
        setDbWarning(data.warning);
        setIsDbConnected(false);
        addLog(`Backend in Fallback Mode. DB Warning: ${data.warning.slice(0, 60)}...`, 'error');
      } else {
        setServerStatus('online');
        setDbWarning(null);
        setIsDbConnected(true);
        addLog(`Ping success. Connected to MongoDB Atlas. (Ping: ${currentPing}ms)`, 'success');
      }
    } catch (err) {
      setServerStatus('offline');
      setDbWarning(null);
      setIsDbConnected(false);
      setPing(null);
      setUptime(0);
      addLog(`Connection failed: ${err.message}. Is Express server active?`, 'error');
    }
  };

  // 4. Fetch Roadmap Tasks
  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const res = await fetch(`${API_URL}/items`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data);
      addLog(`Loaded ${data.length} roadmap items from server.`, 'info');
    } catch (err) {
      addLog(`Error fetching tasks: ${err.message}`, 'error');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // 5. Trigger Health & Task Loads
  useEffect(() => {
    checkServerHealth();
    // Poll server health every 12 seconds
    const interval = setInterval(checkServerHealth, 12000);
    return () => clearInterval(interval);
  }, []);

  // Fetch tasks when server shifts to active online/warning states
  useEffect(() => {
    if (serverStatus === 'online' || serverStatus === 'warning') {
      fetchTasks();
    } else if (serverStatus === 'offline') {
      setTasks([]);
      setIsLoadingTasks(false);
    }
  }, [serverStatus]);

  // Uptime ticker
  useEffect(() => {
    if (serverStatus === 'online' || serverStatus === 'warning') {
      const timer = setInterval(() => {
        setUptime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [serverStatus]);

  // 6. CRUD Operations
  const handleAddTask = async (e) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    if (serverStatus === 'offline') {
      addLog('Cannot add roadmap item. Backend server is offline.', 'error');
      return;
    }

    addLog(`Adding roadmap milestone: "${title}"`, 'info');
    try {
      const res = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });

      if (!res.ok) throw new Error('Failed to create item');
      const newItem = await res.json();
      
      addLog(`Milestone successfully added (ID: ${newItem.id})`, 'success');
      setNewTaskTitle('');
      fetchTasks();
    } catch (err) {
      addLog(`Error adding milestone: ${err.message}`, 'error');
    }
  };

  const handleToggleTask = async (id, title, currentStatus) => {
    if (serverStatus === 'offline') {
      addLog('Cannot update item status. Server is offline.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      
      addLog(`Milestone "${title}" updated to: ${updated.completed ? 'Completed' : 'Active'}`, 'info');
      fetchTasks();
    } catch (err) {
      addLog(`Error toggling status: ${err.message}`, 'error');
    }
  };

  const handleDeleteTask = async (id, title) => {
    if (serverStatus === 'offline') {
      addLog('Cannot delete item. Server is offline.', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete milestone: "${title}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete item');
      
      addLog(`Milestone deleted: "${title}"`, 'success');
      fetchTasks();
    } catch (err) {
      addLog(`Error deleting milestone: ${err.message}`, 'error');
    }
  };

  const formatUptime = (sec) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  // Header and component entry animation definitions
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.25, duration: 0.8 } }
  };

  return (
    <div className="relative min-h-screen py-10 px-4 md:px-8 z-10 max-w-6xl mx-auto flex flex-col justify-between gap-10">
      {/* Ambient background glow spots */}
      <div className="glow-spot glow-1" />
      <div className="glow-spot glow-2" />

      {/* App Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10 z-10"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/30">
            <span className="font-heading font-extrabold text-white text-2xl">A</span>
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-3xl leading-none tracking-tight">
              APL <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">Hub</span>
            </h1>
            <p className="text-xs text-brand-muted mt-1">Production React-Tailwind Control Panel</p>
          </div>
        </div>

        {/* Server Status Badge */}
        <div 
          className={`flex items-center gap-3 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${
            serverStatus === 'online' ? 'bg-brand-secondary/5 border-brand-secondary/30 text-brand-secondary' :
            serverStatus === 'warning' ? 'bg-amber-500/5 border-amber-500/30 text-amber-400' :
            serverStatus === 'offline' ? 'bg-brand-danger/5 border-brand-danger/30 text-brand-danger' :
            'bg-white/5 border-white/10 text-white/50'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full relative flex`}>
            {serverStatus !== 'connecting' && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                serverStatus === 'online' ? 'bg-brand-secondary' :
                serverStatus === 'warning' ? 'bg-amber-400' :
                'bg-brand-danger'
              }`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              serverStatus === 'online' ? 'bg-brand-secondary' :
              serverStatus === 'warning' ? 'bg-amber-400' :
              serverStatus === 'offline' ? 'bg-brand-danger' :
              'bg-brand-dim'
            }`}></span>
          </span>
          <span className="capitalize">
            {serverStatus === 'connecting' ? 'Handshaking...' : `API ${serverStatus}`}
          </span>
        </div>
      </motion.header>

      {/* Main Grid */}
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-5 gap-8 z-10 flex-grow"
      >
        {/* Left Side: Server Health */}
        <motion.section variants={cardVariants} className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col gap-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-xl">Service Monitor</h2>
              <p className="text-xs text-brand-muted">Real-time Node/Express telemetry</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={checkServerHealth}
              className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              title="Refresh metrics"
            >
              <RefreshCw className="w-4 h-4 text-brand-muted hover:text-white transition-colors" />
            </motion.button>
          </div>

          {/* Metric Boxes */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/3 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 hover:bg-white/5 transition-all">
              <span className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold">Engine</span>
              <span className={`text-xs font-bold ${isDbConnected ? 'text-brand-secondary' : 'text-amber-400'}`}>
                {serverStatus === 'offline' ? 'OFFLINE' : (isDbConnected ? 'MONGODB' : 'LOCAL')}
              </span>
            </div>
            <div className="bg-white/3 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 hover:bg-white/5 transition-all">
              <span className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold">Uptime</span>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-primary" />
                {formatUptime(uptime)}
              </span>
            </div>
            <div className="bg-white/3 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 hover:bg-white/5 transition-all">
              <span className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold">Ping</span>
              <span className="text-xs font-bold text-white">
                {ping !== null ? `${ping}ms` : '--'}
              </span>
            </div>
          </div>

          {/* Action Warning banner if in warning status */}
          {serverStatus === 'warning' && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-300 leading-relaxed"
            >
              <p className="font-semibold flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-amber-400" /> Database Firewall Blocked
              </p>
              Your local IP is not whitelisted in MongoDB Atlas. Whitelist your IP to sync with the cloud database.
            </motion.div>
          )}

          {/* Interactive Custom Console */}
          <div className="flex flex-col gap-2 flex-grow min-h-[220px]">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-dim uppercase tracking-wider">
              <Terminal className="w-4 h-4" /> Live Terminal Stream
            </div>
            <div className="flex-grow bg-brand-console border border-white/8 rounded-xl p-4 font-mono text-[11px] overflow-y-auto max-h-[240px] flex flex-col gap-1.5 scroll-smooth">
              {logs.map((log) => (
                <div key={log.id} className="leading-relaxed break-all">
                  <span className="text-brand-dim">[{log.time}]</span>{' '}
                  <span className={
                    log.type === 'system' ? 'text-indigo-400' :
                    log.type === 'success' ? 'text-brand-secondary' :
                    log.type === 'error' ? 'text-brand-danger font-semibold' :
                    'text-blue-400'
                  }>
                    [{log.type.toUpperCase()}]
                  </span>{' '}
                  <span className="text-white/90">{log.text}</span>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </motion.section>

        {/* Right Side: Project Roadmap CRUD */}
        <motion.section variants={cardVariants} className="lg:col-span-3 glass-card rounded-2xl p-6 flex flex-col gap-6 shadow-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-heading font-bold text-xl">Project Milestones</h2>
              <p className="text-xs text-brand-muted">Mongoose CRUD operations</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-xs font-semibold text-purple-300">
              {tasks.length} {tasks.length === 1 ? 'item' : 'items'}
            </div>
          </div>

          {/* Add Milestone Form */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input 
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Plan next production milestone..."
              required
              disabled={serverStatus === 'offline'}
              className="flex-grow bg-white/3 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-brand-dim focus:outline-none focus:border-brand-primary focus:bg-white/5 transition-all"
            />
            <motion.button 
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={serverStatus === 'offline'}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-purple-600 font-bold text-white text-xs flex items-center gap-1.5 shadow-lg shadow-brand-primary/20 hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <span>Add</span>
              <Plus className="w-4 h-4" />
            </motion.button>
          </form>

          {/* Milestones List */}
          <div className="flex-grow min-h-[260px] overflow-y-auto max-h-[360px] pr-1">
            {isLoadingTasks ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 bg-white/2 border border-white/3 rounded-xl p-4 animate-pulse">
                    <div className="w-5 h-5 rounded bg-white/10" />
                    <div className="h-4 bg-white/10 rounded flex-grow max-w-[70%]" />
                  </div>
                ))}
              </div>
            ) : serverStatus === 'offline' ? (
              <div className="flex flex-col items-center justify-center text-center p-8 gap-3 border border-white/5 rounded-xl bg-white/1">
                <WifiOff className="w-12 h-12 text-brand-danger opacity-80" />
                <h3 className="font-semibold text-sm">Server offline</h3>
                <p className="text-xs text-brand-muted max-w-[240px]">Milestones will render dynamically once a backend handshake is established.</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 gap-3 border border-white/5 rounded-xl bg-white/1">
                <Database className="w-12 h-12 text-brand-dim opacity-80" />
                <h3 className="font-semibold text-sm">No milestones found</h3>
                <p className="text-xs text-brand-muted max-w-[240px]">Use the input panel above to sync your first task with the backend database.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {tasks.map(task => (
                    <motion.li 
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      className="group flex items-center justify-between gap-4 bg-white/3 border border-white/5 rounded-xl p-4 hover:bg-white/5 hover:border-white/10 transition-all"
                    >
                      {/* Clickable check area */}
                      <div 
                        onClick={() => handleToggleTask(task.id, task.title, task.completed)}
                        className="flex items-center gap-3.5 flex-grow cursor-pointer"
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                          task.completed 
                            ? 'bg-brand-secondary border-brand-secondary text-white' 
                            : 'border-brand-dim group-hover:border-white/50 text-transparent'
                        }`}>
                          <CheckCircle className="w-3.5 h-3.5 stroke-[3px]" />
                        </div>
                        <span className={`text-sm font-medium transition-all ${
                          task.completed ? 'line-through text-brand-muted' : 'text-white'
                        }`}>
                          {task.title}
                        </span>
                      </div>

                      {/* Delete Action */}
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="p-1.5 rounded-lg text-brand-dim hover:text-brand-danger hover:bg-brand-danger/10 transition-all"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </motion.section>
      </motion.main>

      {/* Footer info */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs text-brand-dim border-t border-white/10 pt-6 mt-6 flex flex-col md:flex-row justify-between items-center gap-4 z-10"
      >
        <p>&copy; 2026 APL Dashboard Ecosystem. Powered by React, Tailwind & Framer Motion.</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-purple-400" /> Client: Vercel Ready</span>
          <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-emerald-400" /> Server: Railway Ready</span>
        </div>
      </motion.footer>
    </div>
  );
}
