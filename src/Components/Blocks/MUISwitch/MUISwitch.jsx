import { FormControlLabel, Switch } from "@mui/material";

// import * as React from 'react';
// import { styled } from '@mui/material/styles';
// import FormGroup from '@mui/material/FormGroup';
// import FormControlLabel from '@mui/material/FormControlLabel';
// import Switch from '@mui/material/Switch';
// import Stack from '@mui/material/Stack';
// import Typography from '@mui/material/Typography';


// const IOSSwitch = styled((props) => (
//   <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
// ))(({ theme }) => ({
//   width: 42,
//   height: 26,
//   padding: 0,
//   '& .MuiSwitch-switchBase': {
//     padding: 0,
//     margin: 2,
//     transitionDuration: '300ms',
//     '&.Mui-checked': {
//       transform: 'translateX(16px)',
//       color: '#fff',
//       '& + .MuiSwitch-track': {
//         backgroundColor: '#65C466',
//         opacity: 1,
//         border: 0,
//         ...theme.applyStyles('dark', {
//           backgroundColor: '#2ECA45',
//         }),
//       },
//       '&.Mui-disabled + .MuiSwitch-track': {
//         opacity: 0.5,
//       },
//     },
//     '&.Mui-focusVisible .MuiSwitch-thumb': {
//       color: '#33cf4d',
//       border: '6px solid #fff',
//     },
//     '&.Mui-disabled .MuiSwitch-thumb': {
//       color: theme.palette.grey[100],
//       ...theme.applyStyles('dark', {
//         color: theme.palette.grey[600],
//       }),
//     },
//     '&.Mui-disabled + .MuiSwitch-track': {
//       opacity: 0.7,
//       ...theme.applyStyles('dark', {
//         opacity: 0.3,
//       }),
//     },
//   },
//   '& .MuiSwitch-thumb': {
//     boxSizing: 'border-box',
//     width: 22,
//     height: 22,
//   marginLeft:"-17px",
//   },
//   '& .MuiSwitch-track': {
//     borderRadius: 26 / 2,
//     backgroundColor: '#E9E9EA',
//     opacity: 1,
//     transition: theme.transitions.create(['background-color'], {
//       duration: 500,
//     }),
//     ...theme.applyStyles('dark', {
//       backgroundColor: '#39393D',
//     }),
//   },
// }));

function MUISwitch({ label, checked, onChange, disabled, sx, ...props }) {
  return (
    <FormControlLabel
      control={
        <Switch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          disableRipple
          disableFocusRipple
          disableTouchRipple
          style={{
            marginLeft: "-15px",
            zIndex: 999,
          }}
          sx={{
            "& .MuiSwitch-switchBase:hover": {
              backgroundColor: "transparent", // Убирает фоновый цвет при наведении
            },
            "& .MuiSwitch-switchBase.Mui-checked:hover": {
              backgroundColor: "transparent", // Убирает фоновый цвет при наведении
            }
          }}
          {...props}
        />
      }
      label={label}
    />
  );
}

export default MUISwitch;
