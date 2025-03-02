import React from "react";
import { Link } from 'react-router-dom';

const DashBoardPage = () => {
    return (
        <div>
            <h1>Dashboard</h1>
            <p>Your fitness status will appear here</p>
            <Link to="/">Go back to home</Link>
        </div>
    );
};

export default DashBoardPage;