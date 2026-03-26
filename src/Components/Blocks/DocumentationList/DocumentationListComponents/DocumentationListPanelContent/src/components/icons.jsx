import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import SmartButtonOutlinedIcon from '@mui/icons-material/SmartButtonOutlined'
import HighlightAltRoundedIcon from '@mui/icons-material/HighlightAltRounded'
import BorderStyleRoundedIcon from '@mui/icons-material/BorderStyleRounded'
import FormatUnderlinedRoundedIcon from '@mui/icons-material/FormatUnderlinedRounded'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import AddRoundedIcon from '@mui/icons-material/AddRounded'

const MuiIcon = ({ Icon, size = 20, style, ...props }) => (
  <Icon
    fontSize="inherit"
    aria-hidden="true"
    style={{
      width: size,
      height: size,
      fontSize: size,
      display: 'block',
      ...style,
    }}
    {...props}
  />
)

export const LinkIcon = ({ size = 20, ...props }) => (
  <>
    {/* Legacy SVG icon:
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
    */}
    <MuiIcon Icon={LinkRoundedIcon} size={size} {...props} />
  </>
)

export const ButtonIcon = ({ size = 20, ...props }) => (
  <>
    {/* Legacy SVG icon:
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="8" width="18" height="8" rx="2" ry="2"/>
      <path d="M12 12v-2"/>
    </svg>
    */}
    <MuiIcon Icon={SmartButtonOutlinedIcon} size={size} {...props} />
  </>
)

export const HighlightIcon = ({ size = 20, ...props }) => (
  <>
    {/* Legacy SVG icon:
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 13h6"/>
      <path d="M11 17h2"/>
      <rect x="3" y="5" width="18" height="14" rx="2"/>
    </svg>
    */}
    <MuiIcon Icon={HighlightAltRoundedIcon} size={size} {...props} />
  </>
)

export const DashedIcon = ({ size = 20, ...props }) => (
  <>
    {/* Legacy SVG icon:
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2,2" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
    */}
    <MuiIcon Icon={BorderStyleRoundedIcon} size={size} {...props} />
  </>
)

export const NoUnderlineIcon = ({ size = 20, ...props }) => (
  <>
    {/* Legacy SVG icon:
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round"/>
      <line x1="5" y1="20" x2="19" y2="20" strokeDasharray="3,3"/>
    </svg>
    */}
    <MuiIcon Icon={FormatUnderlinedRoundedIcon} size={size} {...props} />
  </>
)

export const ColoredIcon = ({ size = 20, ...props }) => (
  <>
    {/* Legacy SVG icon:
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#e0f2fe" stroke="none"/>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
    */}
    <MuiIcon Icon={PaletteOutlinedIcon} size={size} {...props} />
  </>
)

export const AddIcon = ({ size = 20, ...props }) => (
  <>
    {/* Legacy SVG icon:
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    */}
    <MuiIcon Icon={AddRoundedIcon} size={size} {...props} />
  </>
)
