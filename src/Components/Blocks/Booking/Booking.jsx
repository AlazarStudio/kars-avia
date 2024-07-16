import React from 'react';
import classes from './Booking.module.css';

function Booking({ children, ...props }) {
    return (
        <div className={classes.booking} {...props}>
            {children}
        </div>
    );
}

export default Booking;
