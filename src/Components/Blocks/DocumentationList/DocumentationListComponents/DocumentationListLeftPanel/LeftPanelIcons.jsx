import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'

function MuiIcon({ Icon, size = 16, className, style, ...props }) {
  return (
    <Icon
      className={className}
      aria-hidden="true"
      focusable="false"
      fontSize="inherit"
      style={{
        display: 'block',
        width: size,
        height: size,
        fontSize: size,
        ...style,
      }}
      {...props}
    />
  )
}

export function IconSearch(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <StrokeIcon {...props}>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </StrokeIcon>
      */}
      <MuiIcon Icon={SearchRoundedIcon} {...props} />
    </>
  )
}

export function IconX(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <StrokeIcon {...props}>
        <path d="M18 6 6 18" />
        <path d="M6 6l12 12" />
      </StrokeIcon>
      */}
      <MuiIcon Icon={CloseRoundedIcon} {...props} />
    </>
  )
}

export function IconFolder(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <StrokeIcon {...props}>
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </StrokeIcon>
      */}
      <MuiIcon Icon={FolderOutlinedIcon} {...props} />
    </>
  )
}

export function IconFile(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <StrokeIcon {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </StrokeIcon>
      */}
      <MuiIcon Icon={DescriptionOutlinedIcon} {...props} />
    </>
  )
}

export function IconCopy(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <StrokeIcon {...props}>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </StrokeIcon>
      */}
      <MuiIcon Icon={ContentCopyOutlinedIcon} {...props} />
    </>
  )
}

export function IconPencil(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <StrokeIcon {...props}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </StrokeIcon>
      */}
      <MuiIcon Icon={EditOutlinedIcon} {...props} />
    </>
  )
}

export function IconTrash(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <StrokeIcon {...props}>
        <path d="M3 6h18" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </StrokeIcon>
      */}
      <MuiIcon Icon={DeleteOutlineRoundedIcon} {...props} />
    </>
  )
}

export function IconChevronDown(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <StrokeIcon {...props}>
        <path d="m6 9 6 6 6-6" />
      </StrokeIcon>
      */}
      <MuiIcon Icon={ExpandMoreRoundedIcon} {...props} />
    </>
  )
}

export function IconChevronUp(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <StrokeIcon {...props}>
        <path d="m6 15 6-6 6 6" />
      </StrokeIcon>
      */}
      <MuiIcon Icon={ExpandLessRoundedIcon} {...props} />
    </>
  )
}

export function IconChevronLeft(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <StrokeIcon {...props}>
        <path d="m15 18-6-6 6-6" />
      </StrokeIcon>
      */}
      <MuiIcon Icon={ChevronLeftRoundedIcon} {...props} />
    </>
  )
}

export function IconPlus(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <StrokeIcon {...props}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </StrokeIcon>
      */}
      <MuiIcon Icon={AddRoundedIcon} {...props} />
    </>
  )
}

export function IconEllipsis(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <FillIcon {...props}>
        <circle cx="7" cy="12" r="1.6" />
        <circle cx="12" cy="12" r="1.6" />
        <circle cx="17" cy="12" r="1.6" />
      </FillIcon>
      */}
      <MuiIcon Icon={MoreHorizRoundedIcon} {...props} />
    </>
  )
}

export function IconGripVertical(props) {
  return (
    <>
      {/* Legacy SVG icon:
      <FillIcon {...props}>
        <circle cx="9" cy="5" r="1.2" />
        <circle cx="15" cy="5" r="1.2" />
        <circle cx="9" cy="12" r="1.2" />
        <circle cx="15" cy="12" r="1.2" />
        <circle cx="9" cy="19" r="1.2" />
        <circle cx="15" cy="19" r="1.2" />
      </FillIcon>
      */}
      <MuiIcon Icon={DragIndicatorRoundedIcon} {...props} />
    </>
  )
}

/*
Legacy SVG helpers preserved for reference.

function StrokeIcon({ size = 16, className, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'block' }}
      {...props}
    >
      {children}
    </svg>
  )
}

function FillIcon({ size = 16, className, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'block' }}
      {...props}
    >
      {children}
    </svg>
  )
}
*/
