import React from 'react'

const UserIcon = () => {
    const  style = 'w-20 h-20 inline-flex items-center justify-center rounded-full bg-gray-800 text-green-400 mb-5 flex-shrink-0'
    return (
        <div className={style}>
            <svg
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="w-10 h-10"
                viewBox="0 0 24 24"
            >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        </div>
    )
}

export default UserIcon
