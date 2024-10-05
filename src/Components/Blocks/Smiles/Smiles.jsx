import React from "react";
import classes from './Smiles.module.css';

import EmojiPicker from 'emoji-picker-react';

function Smiles({ handleSmileChange, ...props }) {
    const handleEmojiClick = (event, emojiObject) => {
        handleSmileChange(event.emoji);
    };

    return (
        <div className={classes.smileBlock}>
            <EmojiPicker onEmojiClick={handleEmojiClick} searchDisabled={true} />
        </div>
    );
}

export default Smiles;
