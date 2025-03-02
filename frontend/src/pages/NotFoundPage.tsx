import React from "react";
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div>
            <h1>404 - Page NOt Found</h1>
            <p>The Page you are looking for dose not exit.</p>
            <Link to="/">Go back to home</Link>
        </div>
    );
};

export default NotFoundPage;