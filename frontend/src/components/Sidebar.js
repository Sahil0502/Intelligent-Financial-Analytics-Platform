import React from 'react';
import { Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  Brain, 
  MessageSquare,
  Activity,
  Sparkles
} from 'lucide-react';

const Sidebar = ({ isConnected }) => {
  const containerVariants = {
    hidden: { opacity: 0, x: -100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-primary' },
    { to: '/stocks', icon: TrendingUp, label: 'Stock Analysis', color: 'text-success' },
    { to: '/portfolio', icon: Briefcase, label: 'Portfolio', color: 'text-info' },
    { to: '/predictions', icon: Brain, label: 'Predictions', color: 'text-warning' },
    { to: '/sentiment', icon: MessageSquare, label: 'Sentiment Analysis', color: 'text-danger' }
  ];

  return (
    <motion.div 
      className="sidebar"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="text-center mb-4"
        variants={itemVariants}
      >
        <motion.div
          className="d-flex align-items-center justify-content-center mb-3"
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="me-2"
          >
            <Sparkles size={24} className="text-warning" />
          </motion.div>
          <h5 className="text-white mb-0">Financial Analytics</h5>
        </motion.div>
        
        <motion.div 
          className={`connection-status d-flex align-items-center justify-content-center ${isConnected ? 'status-connected' : 'status-disconnected'}`}
          animate={{
            scale: isConnected ? [1, 1.05, 1] : [1, 0.95, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="me-2"
          >
            <Activity size={12} className={isConnected ? 'text-success' : 'text-danger'} />
          </motion.div>
          {isConnected ? 'Connected' : 'Disconnected'}
        </motion.div>
      </motion.div>
      
      <Nav className="flex-column">
        <AnimatePresence>
          {navItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.to}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05,
                  x: 10,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <LinkContainer to={item.to}>
                  <Nav.Link className="d-flex align-items-center position-relative">
                    <motion.div
                      className="me-3"
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        delay: index * 0.5,
                        ease: "easeInOut"
                      }}
                    >
                      <IconComponent size={18} className={item.color} />
                    </motion.div>
                    
                    <motion.span
                      className="nav-text"
                      initial={{ opacity: 0.8 }}
                      whileHover={{ opacity: 1, x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                    
                    <motion.div
                      className="nav-indicator"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '3px',
                        background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
                        transformOrigin: 'left'
                      }}
                    />
                  </Nav.Link>
                </LinkContainer>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Nav>
      
      {/* Floating particles effect */}
      <div className="sidebar-particles">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              left: `${20 + i * 15}%`,
              bottom: `${10 + i * 10}%`,
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: `hsl(${180 + i * 30}, 70%, 60%)`,
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default Sidebar;
