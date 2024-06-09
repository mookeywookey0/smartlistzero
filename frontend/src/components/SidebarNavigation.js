import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChartBar, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Tooltip } from 'react-tooltip';

const SidebarNavigation = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { name: 'Selection', path: '/', icon: <FaHome /> },
    { name: 'Daily Log', path: '/daily-log', icon: <FaChartBar /> },
    { name: 'Scoreboard', path: '/scoreboard', icon: <FaUser /> },
  ];

  return (
    <div className="flex">
      <div className={`fixed inset-y-0 left-0 ${isOpen ? 'sidebar-open' : 'sidebar-closed'} sidebar`}>
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} h-16 shadow-md px-4`}>
          {isOpen && <h1 className="text-lg font-bold">Smart List Zero</h1>}
          <button onClick={toggleSidebar} className="text-gray-800">
            {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => (
            <Link
              to={item.path}
              key={item.name}
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-200 relative"
              data-tooltip-id={item.name}
              data-tooltip-content={item.name}
            >
              <div className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'}`}>
                <span className="text-xl">{item.icon}</span>
                {isOpen && <span className="ml-4">{item.name}</span>}
              </div>
              {location.pathname === item.path && (
                <motion.div
                  className="absolute inset-y-0 left-0 w-1 bg-blue-500"
                  layoutId="navigation-underline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              {!isOpen && <Tooltip id={item.name} place="right" />}
            </Link>
          ))}
        </nav>
      </div>
      <div className={`main-content ${isOpen ? 'ml-48' : 'ml-16'}`}>
        {/* Your routes and other content go here */}
      </div>
    </div>
  );
};

export default SidebarNavigation;
