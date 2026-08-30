export { DSThemeProvider, useTheme, type ThemeTokens } from './theme';
export { Text, type TextVariant, type TextColor } from './text';
export { Button, type ButtonVariant, type ButtonSize } from './button';
export { Input } from './input';
export { Badge, type BadgeTone } from './badge';
export { Card } from './card';
export { EmptyState } from './empty-state';
export { Spinner } from './spinner';
export { Icon } from './icon';
export { GoogleIcon, type GoogleIconProps } from './google-icon';
export { DangerZone, type DangerZoneProps } from './danger-zone';
export { Sheet } from './sheet';
export { ChoiceCard } from './choice-card';
// Form kit (M2) — átomos, FormField (keystone), ListItem, scaffold.
export { CurrencyInput } from './currency-input';
export { DatePicker, type DatePickerProps } from './date-picker';
export { Select, type SelectOption } from './select';
export { Switch, SegmentedControl } from './switch';
export { Stepper } from './stepper';
export { TextArea } from './textarea';
export { FormField } from './form-field';
export { ListItem } from './list-item';
export { SavingBar, FormScreen } from './form-screen';
export { ImageUpload } from './image-upload';

// P0 — feedback, overlay, seleção, navegação (batch RN audit).
export { Alert, type AlertProps, type AlertVariant } from './alert';
export { Toaster, toast, type ToasterProps, type ToastFn, type ToastOptions, type ToastVariant, type ToastPosition } from './toaster';
export { Modal } from './modal';
export { Skeleton, SkeletonText } from './skeleton';
export { Checkbox } from './checkbox';
export { Radio, RadioGroup } from './radio';
export { Divider } from './divider';
export { Avatar, AvatarGroup, initials, type AvatarSize, type AvatarStatus, type AvatarProps, type AvatarGroupProps } from './avatar';
export { IconButton, type IconButtonVariant, type IconButtonColor, type IconButtonSize } from './icon-button';
export { Search } from './search';

// P1 — ação flutuante, overlays de menu, faixas, slider, chips.
export { FAB, FABProvider, useFAB, type FABProps } from './fab';
export { Accordion, AccordionItem, type AccordionProps, type AccordionItemProps } from './accordion';
export { PaywallBanner, type PaywallBannerProps } from './paywall-banner';
export { PaywallContent, type PaywallContentProps, type PaywallReason, type PaywallIcon } from './paywall';
export { Menu, MenuItem } from './menu';
export { ContextMenu } from './context-menu';
export { Slider } from './slider';
export { Chip } from './chips';
export { FilterChip, FilterChipGroup } from './filter-chip';
