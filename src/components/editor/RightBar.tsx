'use client';

import React, { useState } from 'react';
import { FaEye, FaComments, FaCubes } from 'react-icons/fa';
import WatchDog from './WatchDog';
import Chat from './Chat';
import ModelsSuggestion from './ModelsSuggestion';

interface RightBarProps {
  className?: string;
}

const RightBar: React.FC<RightBarProps> = ({ className = '' }) => {
  const [activeButton, setActiveButton] = useState<string>('Chat');

  const options = [
    // {
    //   id: 'WatchDog',
    //   label: 'WatchDog',
    //   icon: FaEye,
    //   description: 'Monitor and track ideas',
    //   component: WatchDog,
    // },
    {
      id: 'Chat',
      label: 'Chat',
      icon: FaComments,
      description: 'Interactive conversations',
      component: Chat,
    },
    // {
    //   id: 'Models',
    //   label: 'Models',
    //   icon: FaCubes,
    //   description: 'Data models and schemas',
    //   component: ModelsSuggestion,
    // }
  ];

  const handleButtonClick = (buttonId: string) => {
    setActiveButton(buttonId);
    // Add your button click logic here
    console.log(`Clicked ${buttonId}`);
  };

  return (
    <div className={`flex flex-col w-full mx-auto items-center bg-(--background) sticky top-10 self-start ${className}`}>
      {/* <div className="flex flex-row justify-center w-full">
        {options.map((button, idx) => {
          const IconComponent = button.icon;
          const isActive = activeButton === button.id;
          const isFirst = idx === 0;
          const isLast = idx === options.length - 1;
          // Only first and last get rounded corners
          const roundedClass = isFirst
            ? "rounded-l-lg"
            : isLast
            ? "rounded-r-lg"
            : "";

          return (
            <button
              key={button.id}
              onClick={() => handleButtonClick(button.id)}
              className={`
                flex flex-row items-center justify-center gap-4 px-1 py-3 ${roundedClass}
                transition-all duration-200 min-w-[100px] group cursor-pointer
                ${isActive 
                  ? 'bg-(--emphasis) text-white shadow-md' 
                  : 'bg-(--darkelbg) text-(--foreground) hover:bg-(--emphasis) hover:text-white'
                }
                ${idx !== 0 ? 'border-l border-(--secondary)/40' : ''}
              `}
              title={button.description}
              style={{ marginLeft: 0, marginRight: 0 }}
            >
              <IconComponent className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium text-center">
                {button.label}
              </span>
            </button>
          );
        })}
      </div> */}

      <div className="flex-1">
        {(() => {
          const activeOption = options.find((opt) => opt.id === activeButton);
          const Component = activeOption?.component;
          return Component ? <Component /> : null;
        })()}
      </div>
    </div>
  );
};

export default RightBar;
