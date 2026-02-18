import React, { useRef, useState } from "react";
import classes from "./ManifestDropdown.module.css";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import { roles } from "../../../roles";
import Button from "../../Standart/Button/Button";

export default function ManifestDropdown({
  request,
  server,
  handleFileChange,
  file,
  user,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const handleButtonClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const onEdit = () => {
    setOpenModal(true);
    handleCloseMenu();
  };

  const onDownload = () => {
    handleCloseMenu();
    // можно добавить логику трекинга, если нужно
  };

  const fileInputRef = useRef(null);

  const handleLabelClick = () => {
    fileInputRef.current && fileInputRef.current.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <Button
        className={`${classes.downloadsButton} ${anchorEl ? classes.open : ""}`}
        onClick={handleButtonClick}
      >
        Манифест
        <span
          style={{
            display: "inline-block",
            transform: anchorEl ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            fontSize: "12px",
          }}
        >
          ▼
        </span>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          style: {
            borderRadius: 10,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            // padding: "8px 0",
            width: 160,
            boxShadow: "1px 8px 12px rgba(0,0,0,0.1)",
          },
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {user?.role !== roles.hotelAdmin && (
          <Button onClick={handleLabelClick} className={classes.downloadsButton}>
            <img src="/editManifest.png" alt="Скачать" />
            Редактировать
          </Button>
          //   <MenuItem onClick={onEdit}>
          //     <ListItemIcon>
          //       <EditIcon fontSize="small" />
          //     </ListItemIcon>
          //     <ListItemText primary="Редактировать" />
          //   </MenuItem>
        )}
        {request?.files && request.files.length > 0 && (
          <a
            href={request.files ? `${server}${request.files[0]}` : ""}
            target="_blank"
            className={classes.downloadsButton}
            rel="noopener noreferrer"
          >
            <img src="/downloadManifest.png" alt="Скачать" />
            Скачать
          </a>
          //   <MenuItem
          //     component="a"
          //     href={`${server}${request.files[0]}`}
          //     target="_blank"
          //     rel="noopener noreferrer"
          //     onClick={onDownload}
          //   >
          //     <ListItemIcon>
          //       <DownloadIcon fontSize="small" />
          //     </ListItemIcon>
          //     <ListItemText primary="Скачать" />
          //   </MenuItem>
        )}
      </Menu>

      {/* <ManifestModal
        user={user}
        open={openModal}
        onClose={() => setOpenModal(false)}
        handleFileChange={handleFileChange}
        file={file}
        request={request}
        server={server}
        classes={classes}
      /> */}
    </>
  );
}
