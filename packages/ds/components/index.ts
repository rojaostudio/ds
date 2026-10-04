// 2.0 (#15): Feedback follows the Figma [RDS] (Alert, AlertDialog, HoverCard, Popover, Toast, Tooltip).
export { Alert } from './alert';
export type { AlertProps, AlertTone } from './alert';
export { AlertDialog } from './alert-dialog';
export type { AlertDialogProps, AlertDialogTone } from './alert-dialog';
export { HoverCard } from './hover-card';
export type { HoverCardProps } from './hover-card';

// 2.0 (#15): Overlays follow the Figma [RDS]. Modal became Dialog; the side panel that was the Drawer is the Sheet,
// and the panel from the bottom that was the BottomSheet is the Drawer. Menu became DropdownMenu (Radix).
export { Dialog, DialogClose } from './dialog';
export type { DialogProps, DialogSize } from './dialog';
export { Sheet, SheetClose } from './sheet';
export type { SheetProps, SheetSide } from './sheet';
export { Drawer, DrawerClose } from './drawer';
export type { DrawerProps } from './drawer';

export { LoadingOverlay } from './loading-overlay';
export type { LoadingOverlayProps } from './loading-overlay';
export {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from './dropdown-menu';
export type {
  DropdownMenuProps,
  DropdownMenuItemProps,
  DropdownMenuItemTone,
  DropdownMenuRadioGroupProps,
  DropdownMenuRadioItemProps,
  DropdownMenuAlign,
  DropdownMenuSide,
} from './dropdown-menu';
export { ContextMenu, ContextMenuItem, ContextMenuSeparator } from './context-menu';
export type { ContextMenuProps, ContextMenuItemProps, ContextMenuItemTone } from './context-menu';
export { Command, CommandGroup, CommandItem } from './command';
export type { CommandProps, CommandGroupProps, CommandItemProps } from './command';

// 2.0 (#14): FilterChip follows the Figma [RDS] Forms/FilterChip; links go through asChild (no next/link).
export { FilterChip, FilterChipGroup } from './filter-chip';
export type { FilterChipProps, FilterChipGroupProps } from './filter-chip';

export { DataTableHeader, FilterDropdown } from './data-table-header';
export type {
  DataTableHeaderProps,
  DataTableHeaderSearch,
  DataTableFilterDef,
  DataTableFilterOption,
} from './data-table-header';

export { Button } from './button';
export type { ButtonProps, ButtonTone, ButtonVariant, ButtonSize, ButtonIconPosition } from './button';

// 2.0 (#15): Indicators follow the Figma [RDS]. The status-with-dot left the Badge and is the Status.
export { Badge, formatBadgeValue } from './badge';
export type { BadgeProps, BadgeTone, BadgeVariant } from './badge';
export { Status } from './status';
export type { StatusProps, StatusTone, StatusVariant, StatusSize } from './status';
export { Delta } from './delta';
export type { DeltaProps, DeltaDirection, DeltaTone } from './delta';
export { Progress } from './progress';
export type { ProgressProps, ProgressKind, ProgressSize } from './progress';
export { StarRating } from './star-rating';
export type { StarRatingProps, StarRatingSize } from './star-rating';

// 2.0 (#16): Content follows the Figma [RDS]. Card: variant surface · soft · outline, size md · sm; the old variants left.
export { Card, CardHeader, CardContent, CardFooter } from './card';
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps, CardVariant, CardSurface, CardSize } from './card';
export { Tile } from './tile';
export type { TileProps, TileTone, TileVariant, TileSize } from './tile';
export { Kbd, KbdGroup } from './kbd';
export type { KbdProps, KbdGroupProps } from './kbd';
export { Sparkline } from './sparkline';
export type { SparklineProps } from './sparkline';
export { Chart } from './chart';
export type { ChartProps, ChartSeries, ChartType } from './chart';
export { Carousel, CarouselPlaceholder } from './carousel';
export type { CarouselProps } from './carousel';
export { Item, ItemGroup } from './item';
export type { ItemProps, ItemGroupProps, ItemVariant, ItemSize } from './item';

// 2.0 (#18): Pricing is a Block of the Figma [RDS]; PricingCard is a deprecated thin wrapper over PricingPlan.
export { Pricing, PricingPlan } from './pricing';
export type { PricingProps, PricingPlanProps } from './pricing';
export { PricingCard } from './pricing-card';
export type { PricingCardProps } from './pricing-card';

// 2.0 (#14): the form fields follow the Figma [RDS] Forms (label, hint, errorMessage, labelPosition).
export { Checkbox } from './checkbox';
export type { CheckboxProps, CheckboxChecked } from './checkbox';
export { CheckboxGroup } from './checkbox-group';
export type { CheckboxGroupProps } from './checkbox-group';

export { Input } from './input';
export type { InputProps, FieldLabelPosition } from './input';
export { PasswordInput } from './password-input';
export type { PasswordInputProps } from './password-input';

export { Radio } from './radio';
export type { RadioProps } from './radio';
export { RadioGroup } from './radio-group';
export type { RadioGroupProps } from './radio-group';

export { Select, SelectItem } from './select';
export type { SelectProps, SelectItemProps } from './select';

export { Spinner } from './spinner';
export type { SpinnerProps, SpinnerSize, SpinnerTone } from './spinner';

export { Skeleton } from './skeleton';

export { StepProgress } from './step-progress';
export type { StepProgressProps } from './step-progress';

// 2.0 (#16): EmptyState became Empty, with the icon by prop.
export { Empty } from './empty';
export type { EmptyProps } from './empty';

export { InsightCard } from './insight-card';
export type { InsightCardProps, InsightCardType } from './insight-card';

export { SectionCard } from './section-card';
export { SectionHeader } from './section-header';
export { Stepper } from './stepper';
export type { StepperProps, StepperStep } from './stepper';
/** @deprecated Renamed to `Stepper` in 2.0 (same props). */
export { FloatingStepper } from './floating-stepper';
/** @deprecated Renamed to `StepperProps` and `StepperStep` in 2.0. */
export type { FloatingStepperProps, FloatingStepperStep } from './floating-stepper';
export type { SectionHeaderProps } from './section-header';
export type { SectionCardProps } from './section-card';

// 2.0 (#18): SummaryBar is a strip of Stats (Figma [RDS] Content/Stat and Content/SummaryBar).
export { Stat } from './stat';
export type { StatProps, StatTone } from './stat';
export { SummaryBar } from './summary-bar';
export type { SummaryBarProps, SummaryBarLayout, SummaryBarItem, SummaryBarTone } from './summary-bar';

export { ToggleCard } from './toggle-card';
export type { ToggleCardProps, ToggleCardLayout } from './toggle-card';

// Deprecated: ToggleCard layout="compact" (Figma [RDS] Forms/ToggleCard). The codemod rewrites it.
export { ToggleCardCompact } from './toggle-card-compact';
export type { ToggleCardCompactProps } from './toggle-card-compact';

// 2.0 (#18): ChipInput follows the Figma [RDS] Forms/ChipInput; the values are strings (ChipItem is gone).
export { ChipInput } from './chip-input';
export type { ChipInputProps } from './chip-input';

export { CopyField } from './copy-field';
export type { CopyFieldProps } from './copy-field';
export { QRDisplay } from './qr-display';
export type { QRDisplayProps } from './qr-display';

export { ChoiceCard, ChoiceCardGroup } from './choice-card';
export type { ChoiceCardProps, ChoiceCardGroupProps, ChoiceCardLayout } from './choice-card';
// #4: the dense list to choose one from (client search, catalog, side panel). Rows with a line only at the bottom.
export { ChoiceList, ChoiceListItem } from './choice-list';
export type { ChoiceListProps, ChoiceListItemProps } from './choice-list';
// Deprecated (#18): thin wrappers over the ChoiceCard (layout tile, row and preview).
export { OptionTile, OptionTileGrid } from './option-tile';
export type { OptionTileProps, OptionTileItem, OptionTileGridProps } from './option-tile';

export { SelectableCard } from './selectable-card';
export type { SelectableCardProps } from './selectable-card';

export { ChoicePreviewCard } from './choice-preview-card';
export type { ChoicePreviewCardProps } from './choice-preview-card';

// Deprecated (#16): a thin wrapper over the Item.
export { SettingRow } from './setting-row';
export type { SettingRowProps } from './setting-row';

export { SettingsList } from './settings-list';
export type { SettingsListProps } from './settings-list';

/** @deprecated FileInput layout="dropzone". */
export { Dropzone } from './dropzone';
export type { DropzoneProps } from './dropzone';

export { MediaTile } from './media-tile';
export type { MediaTileProps, MediaTileAspect } from './media-tile';

// 2.0 (#17): Chat follows the Figma [RDS]. ChatBubble became Bubble (variant fill · soft · outline · ghost, tone
// neutral · action · danger, typing, align start · end).
export { Attachment } from './attachment';
export type { AttachmentProps, AttachmentStatus, AttachmentOrientation } from './attachment';
export { Bubble } from './bubble';
export type { BubbleProps, BubbleVariant, BubbleTone, BubbleAlign } from './bubble';
export { Marker } from './marker';
export type { MarkerProps, MarkerKind, MarkerVariant } from './marker';
export { Message } from './message';
export type { MessageProps, MessageAlign } from './message';
export { MessageScroller } from './message-scroller';
export type { MessageScrollerProps } from './message-scroller';
export { Questionnaire } from './questionnaire';
export type { QuestionnaireProps, QuestionnaireAnswer } from './questionnaire';

// Deprecated (#18): a thin wrapper over the Bubble with `typing`.
export { TypingIndicator } from './typing-indicator';
export type { TypingIndicatorProps } from './typing-indicator';

export { ChoiceCarousel } from './choice-carousel';
export type { ChoiceCarouselProps } from './choice-carousel';

// 2.0 (#16): PageTabs became Tabs (Radix Tabs, no next/*: links come in through asChild).
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps } from './tabs';

export { PageHeader } from './page-header';
export type { PageHeaderProps, PageHeaderHeading } from './page-header';

export { Sidebar, SidebarItem, SidebarSection, SidebarSeparator } from './sidebar';
export type { SidebarProps, SidebarItemProps, SidebarSectionProps, SidebarHeader } from './sidebar';

export { NavigationMenu } from './navigation-menu';
export type { NavigationMenuProps, NavigationMenuEntry, NavigationMenuLink, NavigationMenuLinkComponent } from './navigation-menu';

export { SavingBar } from './saving-bar';
export type { SavingBarProps, SavingBarStatus } from './saving-bar';

export { SavingBarProvider, SavingBarRoot, usePageSavingBar } from './saving-bar-context';
export type { SavingBarRegistration } from './saving-bar-context';

export { FAB, FABProvider, FABRoot, useFAB, usePageFAB } from './fab';
export type { FABProps, FABConfig } from './fab';
export type { SkeletonProps, SkeletonShape } from './skeleton';

// 2.0 (#16): Table follows the Figma [RDS]: caption, status, TableHead is the column header (<th>), TableCell the cell.
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableStatus } from './table';
export type {
  TableProps,
  TableHeadProps,
  TableCellProps,
  TableStatusProps,
  TableAlign,
  TableSort,
} from './table';

export { Textarea } from './textarea';
export type { TextareaProps } from './textarea';

// 2.0 (#14): Toggle is the [RDS] pressable button; the on/off switch that was called Toggle is Switch.
export { Toggle } from './toggle';
export type { ToggleProps, ToggleVariant } from './toggle';
export { Switch } from './switch';
export type { SwitchProps } from './switch';

export { Tooltip } from './tooltip';
export type { TooltipProps, TooltipSide } from './tooltip';

// 2.0 (#15): toaster.tsx became toast.tsx (Radix Toast): toast({ title, tone, variant }) and one <Toaster />.
export { Toaster, ToastView, toast, useToast, toastClassName } from './toast';
export type { ToasterProps, ToastViewProps, ToastTone, ToastVariant, ToastOptions, ToastFn } from './toast';

// 2.0 (#13): Separator is the [RDS] name of Divider; Divider left in wave 3 (#16).
export { Separator } from './separator';
export type { SeparatorProps, SeparatorOrientation } from './separator';

// 2.0: Heading follows the Figma [RDS] Content/Heading: a title in the brand pair, with Heading.Mark.
export { Heading, HeadingMark } from './heading';
export type { HeadingProps, HeadingMarkProps, HeadingLevel, HeadingTone, HeadingElement } from './heading';

export { Avatar, AvatarGroup, initials } from './avatar';
export type { AvatarProps, AvatarGroupProps, AvatarSize, AvatarGroupSize, AvatarType, AvatarContent, AvatarVariant } from './avatar';

export { IconButton } from './icon-button';
export type { IconButtonProps } from './icon-button';

export { ButtonGroup } from './button-group';
export type { ButtonGroupProps, ButtonGroupOrientation } from './button-group';

export { ActionBar } from './action-bar';
export type { ActionBarProps } from './action-bar';

export { FormActions } from './form-actions';
export type { FormActionsProps, FormActionsLayout } from './form-actions';

export { Breadcrumb } from './breadcrumb';
export type { BreadcrumbProps, BreadcrumbItem, BreadcrumbTone, BreadcrumbLinkComponent } from './breadcrumb';

export { Pagination, pageItems } from './pagination';
export type { PaginationProps, PaginationLinkComponent } from './pagination';

export { Popover, PopoverClose } from './popover';
export type { PopoverProps, PopoverSide, PopoverAlign } from './popover';

export { ToggleGroup, ToggleGroupItem } from './toggle-group';
export type { ToggleGroupProps, ToggleGroupItemProps } from './toggle-group';

export { Accordion, AccordionItem } from './accordion';
export type { AccordionProps, AccordionItemProps } from './accordion';

// 2.0 (#14): Forms part B follows the Figma [RDS] (Slider, Combobox, DatePicker, Calendar, FileInput, InputOTP, Listbox).
export { Slider } from './slider';
export type { SliderProps } from './slider';
export { Listbox, ListboxOption } from './listbox';
export type { ListboxProps, ListboxOptionProps } from './listbox';
export { Calendar } from './calendar';
export type { CalendarProps, IsoDate } from './calendar';
export { FileInput, formatFileSize } from './file-input';
export type { FileInputProps, FileInputLayout, FileInputVariant } from './file-input';
export { NumberInput } from './number-input';
export type { NumberInputProps, NumberInputStep } from './number-input';
export { InputOTP } from './input-otp';
export type { InputOTPProps, InputOTPLength } from './input-otp';

export { Combobox } from './combobox';
export type { ComboboxProps, ComboboxSingleProps, ComboboxMultipleProps, ComboboxOption } from './combobox';

export { DatePicker } from './date-picker';
export type { DatePickerProps } from './date-picker';

export { TimePicker, parseTime, formatTime } from './time-picker';
export type { TimePickerProps, TimeFormat } from './time-picker';

export { Chip } from './chip';
export type { ChipProps } from './chip';

export { PageSkeleton, CardsSkeleton } from './page-skeleton';
export type { PageSkeletonProps, CardsSkeletonProps } from './page-skeleton';

export { CurrencyInput } from './currency-input';
export type { CurrencyInputProps } from './currency-input';
export { ColorInput, normalizeHex } from './color-input';
export type { ColorInputProps } from './color-input';

// PhoneInput, ImageCropDialog and ImageUpload are NOT in the barrel: they import optional peers
// (react-international-phone, react-image-crop), and a barrel export would make every consumer install
// them (#2). Import them from their own entry: @rojaostudio/ds/components/phone-input,
// .../image-crop-dialog, .../image-upload. (`.../image-crop-modal`, the old name, still works: deprecated.)

export { RowActions } from './row-actions';
export type { RowActionsProps, RowActionItem } from './row-actions';

export { PageShell } from './page-shell';
export type { PageShellProps, PageShellHeaderProps, PageShellBodyProps, PageShellWidth } from './page-shell';

export { DangerZone, DangerZoneItem } from './danger-zone';
export type { DangerZoneProps, DangerZoneItemProps } from './danger-zone';

// 2.0 (#17): Blocks follow the Figma [RDS]. Each block adapts to its container's width (container query), not the
// viewport's: the Figma `screen` desktop · mobile. Logos always by slot.
export { Banner } from './banner';
export type { BannerProps } from './banner';
export { Benefits, BenefitsItem } from './benefits';
export type { BenefitsProps, BenefitsItemProps } from './benefits';
export { Contact } from './contact';
export type { ContactProps } from './contact';
export { FAQ } from './faq';
export type { FAQProps } from './faq';
export { Footer, FooterColumn } from './footer';
export type { FooterProps, FooterColumnProps } from './footer';
export { Newsletter } from './newsletter';
export type { NewsletterProps } from './newsletter';
export { Testimonial, TestimonialItem } from './testimonial';
export type { TestimonialProps, TestimonialItemProps } from './testimonial';
export { TopNavigation } from './top-navigation';
export type { TopNavigationProps } from './top-navigation';

// 2.0 (#17): External follows the Figma [RDS]: mockups of other companies' interfaces, for flows and showrooms.
// PhoneFrame became Phone (platform ios · android, browser, url).
export { Phone } from './phone';
export type { PhoneProps, PhonePlatform } from './phone';
export { Browser } from './browser';
export type { BrowserProps } from './browser';
export { GoogleButton } from './google-button';
export type { GoogleButtonProps, GoogleButtonTheme, GoogleButtonShape, GoogleButtonType } from './google-button';
export { GoogleSignIn } from './google-sign-in';
export type { GoogleSignInProps, GoogleSignInStep, GoogleLayout } from './google-sign-in';
export { GoogleConsent } from './google-consent';
export type { GoogleConsentProps } from './google-consent';
export { GoogleAccountChooser } from './google-account-chooser';
export type { GoogleAccountChooserProps, GoogleAccount } from './google-account-chooser';
export { WhatsAppChat } from './whatsapp-chat';
export type { WhatsAppChatProps } from './whatsapp-chat';
export { WhatsAppMessage } from './whatsapp-message';
export type { WhatsAppMessageProps, WhatsAppMessageType, WhatsAppPlatform } from './whatsapp-message';
export { WhatsAppNotification } from './whatsapp-notification';
export type { WhatsAppNotificationProps } from './whatsapp-notification';
export { WhatsAppTemplate, WhatsAppTemplateButton } from './whatsapp-template';
export type {
  WhatsAppTemplateProps,
  WhatsAppTemplateHeader,
  WhatsAppTemplateButtonProps,
  WhatsAppTemplateButtonType,
  WhatsAppTemplateButtonStatus,
} from './whatsapp-template';

// 2.0 (#19, wave 6): the product components left the design system (Paywall*, BlockerCard, CopilotHint, Notice) and
// go back into the product that uses them; PixIcon moved to @rojaostudio/ds/icons. Label, Search, Themed and
// FormCardHeader left too: a field takes its own `label`, a search is an Input (leadingIcon + clearable), a theme is
// a class on an element, and a card header is the CardHeader.
