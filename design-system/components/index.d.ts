// Fit Health Distribution components. Generated from components/src by scripts/build.mjs.
import type * as React from 'react';

/** Tones shared by Badge, Alert and the deltas on a StatCard. */
export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

/** A glyph name from the Phosphor Bold subset kept in `assets/Icons`. */
export type IconName = 'lockers' | 'jar-label' | 'drop' | 'package' | 'storefront' | 'shopping-cart-simple' | 'tag' | 'truck' | 'barbell' | 'pill' | 'lightning' | 'squares-four' | 'chart-bar' | 'chart-line-up' | 'users-three' | 'user' | 'tray' | 'envelope-simple' | 'chat-text' | 'phone' | 'map-pin' | 'buildings' | 'gear' | 'sign-out' | 'lock-simple' | 'shield-check' | 'bell' | 'text-aa' | 'plus' | 'minus' | 'x' | 'check' | 'trash' | 'pencil-simple' | 'magnifying-glass' | 'funnel-simple' | 'eye' | 'eye-slash' | 'copy-simple' | 'upload-simple' | 'download-simple' | 'arrows-clockwise' | 'dots-three' | 'list' | 'link-simple' | 'caret-down' | 'caret-up' | 'caret-left' | 'caret-right' | 'caret-up-down' | 'arrow-right' | 'arrow-left' | 'arrow-up-right' | 'trend-up' | 'trend-down' | 'warning' | 'warning-circle' | 'info' | 'check-circle' | 'x-circle' | 'clock' | 'calendar-blank' | 'image' | 'star' | 'currency-dollar' | 'receipt' | 'question';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
    /** `primary` is the volt fill: the one call to action in a view. `solid` is ink. `outline` (default) and `ghost` are for everything else. `danger` deletes. */
    variant?: 'primary' | 'solid' | 'outline' | 'ghost' | 'danger';
    /** `sm` 32px for table rows and filters, `md` 40px, `lg` 48px for the storefront. */
    size?: 'sm' | 'md' | 'lg';
    /** Icon before the label. */
    iconLeft?: IconName;
    /** Icon after the label. */
    iconRight?: IconName;
    /** Makes a square, icon-only button. Give it an `aria-label`. */
    icon?: IconName;
    /** Shows a spinner in place of the left icon and blocks clicks. */
    loading?: boolean;
    /** Stretches the button to its container's width. */
    block?: boolean;
    /** Renders a link that looks like a button. */
    href?: string;
    type?: 'button' | 'submit' | 'reset';
}
/** The action control. Label in uppercase Big Shoulders, 2px edge, 2px corners. */
export declare function Button(props: ButtonProps): React.JSX.Element;

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
    /** The filter is on. Drawn as an ink fill. */
    selected?: boolean;
    /** How many results the filter holds, shown in mono after the label. */
    count?: number;
    /** Leading icon. */
    icon?: IconName;
}
/** A filter toggle: category filters in the catalog, status filters in the admin. */
export declare function Chip(props: ChipProps): React.JSX.Element;

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
    /** Always give one. Hide it with `hideLabel` when the context already names the field (a search box). */
    label: React.ReactNode;
    /** Help text under the control. */
    hint?: React.ReactNode;
    /** Error text. Turns the edge to `danger` and is announced with the field. */
    error?: React.ReactNode;
    /** Short text or icon inside the control, before the value: "$". */
    prefix?: React.ReactNode;
    /** Short text inside the control, after the value: "lb", "units". */
    suffix?: React.ReactNode;
    /** Renders a textarea. */
    multiline?: boolean;
    /** Visible rows when `multiline`. */
    rows?: number;
    /** Keeps the label for screen readers only. */
    hideLabel?: boolean;
}
/** A labelled text input or textarea with hint and error. */
export declare function TextField(props: TextFieldProps): React.JSX.Element;

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label: React.ReactNode;
    options: SelectOption[];
    /** Shown while nothing is chosen: "Choose a category". */
    placeholder?: string;
    hint?: React.ReactNode;
    error?: React.ReactNode;
    /** Keeps the label for screen readers only. */
    hideLabel?: boolean;
}
/** A labelled native select, styled to match TextField. */
export declare function Select(props: SelectProps): React.JSX.Element;

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /** Text beside the box. Without it, pass `aria-label`. */
    label?: React.ReactNode;
    /** A quieter second line under the label. */
    hint?: React.ReactNode;
    /** Some, not all: the select-all box of a table with a partial selection. */
    indeterminate?: boolean;
    /** Error text under the box: a required agreement that was left empty. Announced with the box. */
    error?: React.ReactNode;
}
/** A checkbox. Checked is a volt fill with an ink tick. */
export declare function Checkbox(props: CheckboxProps): React.JSX.Element;

export interface CheckboxGroupProps extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'title'> {
    /** Names the group, like a field label: "I am interested in". */
    legend: React.ReactNode;
    /** Help under the legend: "Tick everything that applies." */
    hint?: React.ReactNode;
    /** Error text under the boxes: "Tick at least one." Announced with the group. */
    error?: React.ReactNode;
    /** Marks the group with the required asterisk. At least one box has to be ticked; say so in `hint` or `error`. */
    required?: boolean;
    /** Keeps the legend for screen readers only, for a nested group whose parent box already names it. */
    hideLegend?: boolean;
    /** Indents the group under the box that opened it, with a hairline: the products of a ticked category. */
    nested?: boolean;
    /** Checkboxes, and nested groups. */
    children: React.ReactNode;
}
/** Several boxes answering one question, any number of them ticked. A real fieldset, so the question is read with each box. */
export declare function CheckboxGroup(props: CheckboxGroupProps): React.JSX.Element;

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
    /** Names the setting: "Show in catalog". Without it, pass `aria-label`. */
    label?: React.ReactNode;
    /** A quieter second line that says what turning it on does. */
    hint?: React.ReactNode;
}
/** An on/off setting that takes effect at once, such as showing a product in the catalog. */
export declare function Switch(props: SwitchProps): React.JSX.Element;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** What the badge means. `accent` is volt (New, Featured), `solid` is ink, the rest are status tones. */
    tone?: Tone | 'solid';
    /** Leading status dot. */
    dot?: boolean;
    /** Leading icon, instead of the dot. */
    icon?: IconName;
}
/** One or two words of status. The word carries the meaning; the tone backs it up. */
export declare function Badge(props: BadgeProps): React.JSX.Element;

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
    /** A bold first line. The body goes in `children`. */
    title?: React.ReactNode;
    /** Overrides the tone's icon. */
    icon?: IconName;
    /** A small button or link on the right: "Undo", "View". */
    action?: React.ReactNode;
    /** Shows a close button and is called when it is pressed. */
    onDismiss?: () => void;
    /** Accessible name of the close button. */
    dismissLabel?: string;
}
/** A message in the flow of the page: a save confirmed, a product hidden, a form that failed. */
export declare function Alert(props: AlertProps): React.JSX.Element;

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Says what is missing: "No products yet". */
    title: string;
    /** One sentence on what to do about it. */
    description?: React.ReactNode;
    icon?: IconName;
    /** One button that fixes it: "Add product". */
    action?: React.ReactNode;
    /** Less padding, for use inside a table or a small panel. */
    compact?: boolean;
}
/** What a list shows before it has anything in it, with the one action that fills it. */
export declare function EmptyState(props: EmptyStateProps): React.JSX.Element;

export interface ProductCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
    /** The product name, sentence case. */
    name: string;
    /** Shown as an eyebrow: "Vending machines", "Supplements", "Drinks". */
    category?: string;
    /** One or two lines. Clamped to two. */
    description?: string;
    /** Photo URL, shown 4:3 and cropped to fill. */
    image?: string;
    imageAlt?: string;
    /** Category glyph shown while there is no photo. */
    icon?: IconName;
    /** A number is formatted as US dollars; a string is shown as given ("Call for price"). Leave it out to hide the price. */
    price?: number | string;
    /** A short line under the price: "per case of 12", "starting at". */
    priceNote?: string;
    /** Up to two badges over the photo. */
    badges?: Array<{
        label: string;
        tone?: Tone | 'solid';
    }>;
    /** Out of stock or hidden: the photo fades and the button is disabled. */
    unavailable?: boolean;
    /** The client has already added this product to their request. */
    selected?: boolean;
    /** Button label. Default "I'm interested". */
    ctaLabel?: string;
    /** Button label once selected. Default "Added". */
    selectedLabel?: string;
    /** Button label when `unavailable`. Default "Unavailable". */
    unavailableLabel?: string;
    /** Called when the client presses the button. */
    onInterest?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    /** Links the name to the product page. */
    href?: string;
}
/** One product in the catalog: photo, name, price and the button a client presses to ask about it. */
export declare function ProductCard(props: ProductCardProps): React.JSX.Element;

export interface RequestListItem {
    id: string;
    /** The product name, sentence case. */
    name: string;
    /** Shown under the name: "Vending machines". */
    category?: string;
    /** The category glyph beside the name. */
    icon?: IconName;
}
export interface RequestListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    /** The heading: "Your request". */
    title: string;
    /** How many products it holds, written out: "3 products in your request". Shown while it has items. */
    summary: string;
    items: RequestListItem[];
    /** Shown in place of the list while it is empty: what to press to add something. */
    empty: React.ReactNode;
    /** The remove button's visible label. Default "Remove". */
    removeLabel?: string;
    /** The remove button's accessible name for one item, starting with the visible label: "Remove Whey protein from your request". */
    removeAriaLabel?: (item: RequestListItem) => string;
    /** Called with the item's id when the client removes it. Focus moves to the next item, or to the heading once the list is empty. */
    onRemove?: (id: string) => void;
    /** The heading level that fits the page outline. Default 3. */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
}
/** The products a client has picked in the catalog, beside the contact form. Not a cart: there is nothing to pay. */
export declare function RequestList(props: RequestListProps): React.JSX.Element;

export interface SpecItem {
    /** What is measured, sentence case: "Selections", "Power". */
    label: string;
    /** The figure with its unit: "40", "115 V", "72 x 39 x 35 in". */
    value: string;
}
export interface SpecListProps extends React.HTMLAttributes<HTMLDListElement> {
    items: SpecItem[];
}
/** A product's specifications on its page: one row per spec, label beside value, under a heavy rule. */
export declare function SpecList(props: SpecListProps): React.JSX.Element | null;

export interface PhotoFieldProps {
    /** Names the photo: "Photo". */
    label: React.ReactNode;
    /** What to pick: "JPEG, PNG or WebP, up to 5 MB. Shown at 4:3." */
    hint?: React.ReactNode;
    /** What went wrong and how to fix it. Turns the frame's edge to `danger`. */
    error?: React.ReactNode;
    /** The photo shown now: the saved one, or the one just chosen. None shows an empty frame. */
    src?: string | null;
    /** Describes the photo for screen readers. Leave empty when the product's name is already beside it. */
    alt?: string;
    /** File types the picker offers: "image/jpeg,image/png,image/webp". */
    accept?: string;
    /** Called with the file the admin picked. Check its type and size here; the picker's filter is only a convenience. */
    onSelect: (file: File) => void;
    /** Shows a remove button while there is a photo. */
    onRemove?: () => void;
    /** While the photo uploads: the buttons wait and the frame says so. */
    busy?: boolean;
    /** The button with no photo yet. */
    chooseLabel?: string;
    /** The button once there is a photo. */
    replaceLabel?: string;
    removeLabel?: string;
    /** Said while `busy`. */
    busyLabel?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
}
/** Choose, replace or remove one photo, with a 4:3 preview in the same frame the catalog uses. */
export declare function PhotoField(props: PhotoFieldProps): React.JSX.Element;

export interface StatCardDelta {
    /** The change, written out: "+4 pts", "-12", "No change". */
    label: string;
    /** Which arrow to show. */
    direction?: 'up' | 'down' | 'flat';
    /** Whether the change is good news. Defaults to up = success, down = danger, flat = neutral; set it when down is good. */
    tone?: 'success' | 'danger' | 'neutral';
}
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** What is being counted, as an eyebrow: "Client retention". */
    label: string;
    /** The number. */
    value: React.ReactNode;
    /** Set at half size after the number: "%", "days". */
    unit?: string;
    /** Change against the comparison period. */
    delta?: StatCardDelta;
    /** Names the comparison period: "vs. previous 90 days". */
    helper?: string;
    /** Puts the volt highlighter behind the number. One per row of cards. */
    highlight?: boolean;
    /** A glyph in the top corner. */
    icon?: IconName;
    /** `inverse` paints the card near-black with a volt rule, to single out one figure on a light page. */
    tone?: 'default' | 'inverse';
    /** Up to 12 recent values drawn as small bars; the last is volt. */
    trend?: number[];
}
/** One business figure for the admin dashboard, with its change and comparison period. */
export declare function StatCard(props: StatCardProps): React.JSX.Element;

export interface BarChartDatum {
    /** Tick under the bar: "Jun". */
    label: string;
    value: number;
}
export interface BarChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
    data: BarChartDatum[];
    /** One sentence that says what the chart shows, read out before the values. */
    ariaLabel: string;
    /** Top of the scale. Defaults to 100 when `unit` is "%", otherwise the largest value rounded up to a clean step. */
    max?: number;
    /** Appended to values and scale labels: "%". */
    unit?: string;
    /** Index of the bar drawn in volt. Defaults to the last bar; pass -1 for none. */
    highlight?: number;
    /** Plot height in px. */
    height?: number;
    /** Prints each value above its bar. */
    showValues?: boolean;
}
/** Vertical bars over time: retention by month, inquiries by week. Ink bars, one volt bar for the period that matters. */
export declare function BarChart(props: BarChartProps): React.JSX.Element;

export interface DataTableColumn<Row = any> {
    /** Field name on the row; also the sort key. */
    key: string;
    header: React.ReactNode;
    align?: 'left' | 'right' | 'center';
    width?: number | string;
    /** The narrowest the column may get before the table scrolls sideways. Give one to the name column. */
    minWidth?: number | string;
    /** Keeps the cell on one line. */
    nowrap?: boolean;
    /** Sets the cell in Chivo Mono: SKUs, prices, counts. */
    mono?: boolean;
    /** Makes the header a sort button. Sorting itself is yours: handle `onSort` and pass sorted `rows`. */
    sortable?: boolean;
    /** Custom cell. Defaults to `row[key]`. */
    render?: (row: Row, index: number) => React.ReactNode;
}
export interface DataTableSort {
    key: string;
    direction: 'asc' | 'desc';
}
export interface DataTableProps<Row = any> {
    columns: Array<DataTableColumn<Row>>;
    rows: Row[];
    /** A stable id for each row. */
    rowKey: (row: Row, index: number) => string;
    /** Names the table for screen readers: "Products". Not shown. */
    caption: string;
    sort?: DataTableSort;
    onSort?: (sort: DataTableSort) => void;
    /** Adds a checkbox column. */
    selectable?: boolean;
    selectedKeys?: string[];
    onSelectionChange?: (keys: string[]) => void;
    /** Tighter rows for long lists. */
    dense?: boolean;
    /** Shown in place of rows when there are none: an EmptyState. */
    empty?: React.ReactNode;
    className?: string;
}
/** The admin's list view: products, clients, inquiries. Scrolls sideways before it squeezes. */
export declare function DataTable<Row = any>(props: DataTableProps<Row>): React.JSX.Element;

export interface InquiryCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
    /** The client's name. */
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    /** City and state, or the site the machine is for. */
    location?: string;
    /** When it arrived, already formatted: "Nov 22, 9:41 AM". */
    receivedAt: string;
    /** What the client wrote. Line breaks are kept. */
    message: string;
    /** Names of the products the client asked about. */
    interestedIn?: string[];
    /** `new` has not been opened, `read` has, `replied` is done. */
    status?: 'new' | 'read' | 'replied';
    /** Called by the Reply button. Without it, Reply opens a mail to `email`. With `replyHref`, it runs as the mail opens. */
    onReply?: () => void;
    /** Where Reply goes: a `mailto:` with a subject, say. Reply then stays a link, so the mail opens however `onReply` is set. */
    replyHref?: string;
    /** Called by Mark as read, which shows only while `status` is `new`. */
    onMarkRead?: () => void;
    /**
     * Called by Mark as replied, which shows until `status` is `replied`. Opening a mail is not replying: the admin says so
     * here once the mail has gone.
     */
    onMarkReplied?: () => void;
    /** The inquiry's own page. The client's name links to it. */
    href?: string;
    /** While a change is being saved: the buttons wait. */
    busy?: boolean;
    /** The footer line that tells the admin who can see this. Pass `false` to hide it. */
    privacyNote?: string | false;
}
/** Everything a client sent through the contact form, in one place, for admins only. */
export declare function InquiryCard(props: InquiryCardProps): React.JSX.Element;

export interface ContentFieldProps {
    /** What this text is: "Headline", "Main button". */
    label: string;
    /** Where it shows on the site, as an eyebrow: "Home · Hero". */
    location?: string;
    /** The text as it stands in the editor. */
    value: string;
    onChange: (value: string) => void;
    /** The text the site shipped with. Shown under the field once it differs, and what Restore original puts back. */
    original: string;
    /** The text clients see right now. When `value` differs from it the field is marked Unpublished. */
    published?: string;
    /** A paragraph rather than a line. */
    multiline?: boolean;
    /** Visible rows when `multiline`. */
    rows?: number;
    /** The longest the text can be before it breaks the layout. Shows a counter and an error past it; typing is not blocked. */
    maxLength?: number;
    /** How the text is used: "One word of it takes the highlighter." */
    hint?: React.ReactNode;
    /** Overrides the built-in too-long message, or reports another problem such as an empty field. */
    error?: React.ReactNode;
    disabled?: boolean;
    className?: string;
}
/** One piece of website text in the admin's Site content page: edit it, see that it changed, put the original back. */
export declare function ContentField(props: ContentFieldProps): React.JSX.Element;

export interface TabItem {
    id: string;
    label: React.ReactNode;
    /** A count shown in a pill after the label. */
    count?: number;
    disabled?: boolean;
}
export interface TabsProps {
    items: TabItem[];
    /** The selected tab id. Leave it out, with `defaultValue`, to let Tabs keep its own state. */
    value?: string;
    defaultValue?: string;
    onChange?: (id: string) => void;
    /** Names the tab list for screen readers: "Product views". */
    ariaLabel?: string;
    /**
     * The id of the element the tabs control. Give it `role="tabpanel"` and `aria-labelledby` set to the selected tab's id,
     * which is `${panelId}-tab-${item.id}`. Every tab points at it, so one panel can show each view in turn.
     */
    panelId?: string;
    className?: string;
}
/** Switches between views of one thing. The selected tab carries the heavy rule. */
export declare function Tabs(props: TabsProps): React.JSX.Element;

export interface NavLink {
    id: string;
    label: string;
    href: string;
}
export interface NavBarProps extends React.HTMLAttributes<HTMLElement> {
    links: NavLink[];
    /** The `id` of the link for the page being shown. */
    current?: string;
    /** Replaces the wordmark: a logo image once there is one. */
    brand?: React.ReactNode;
    brandHref?: string;
    /** Buttons at the far right. At most one of them `primary`. */
    actions?: React.ReactNode;
    /** The bar's own theme. `dark` by default, so the storefront opens on a black band; `inherit` follows the page. */
    theme?: 'dark' | 'light' | 'inherit';
    /** Intercept a link click, for client-side routing. */
    onNavigate?: (link: NavLink, event: React.MouseEvent<HTMLAnchorElement>) => void;
    /** Accessible name of the navigation landmark. */
    label?: string;
    /** Accessible names of the phone menu button, closed and open. */
    openMenuLabel?: string;
    closeMenuLabel?: string;
}
/** The storefront's top bar: wordmark, section links, and the quote button. Collapses to a menu under 760px. */
export declare function NavBar(props: NavBarProps): React.JSX.Element;

export interface SidebarItem {
    id: string;
    label: string;
    icon?: IconName;
    /** A count in a pill at the right: unread inquiries. */
    count?: number;
    /** Renders a link. Without it the item is a button and `onSelect` does the work. */
    href?: string;
}
export interface SidebarSection {
    /** An eyebrow over the group: "Catalog". */
    title?: string;
    items: SidebarItem[];
}
export interface SidebarUser {
    name: string;
    /** "Owner", "Admin". */
    role?: string;
    /** Shows a sign-out button. */
    onSignOut?: () => void;
}
export interface SidebarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
    sections: SidebarSection[];
    /** The `id` of the item for the page being shown. */
    current?: string;
    onSelect?: (id: string, event: React.MouseEvent<HTMLElement>) => void;
    /** Replaces the wordmark at the top. */
    brand?: React.ReactNode;
    /** The signed-in admin, shown at the bottom. */
    user?: SidebarUser;
    /** The sidebar's own theme. `dark` by default, against a light admin canvas; `inherit` follows the page. */
    theme?: 'dark' | 'light' | 'inherit';
    /** Accessible name of the navigation landmark. */
    label?: string;
}
/** The admin's navigation rail. The current page is a volt block. */
export declare function Sidebar(props: SidebarProps): React.JSX.Element;

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
    /** The panel's heading, set in uppercase Big Shoulders. */
    title?: React.ReactNode;
    /** A line under the title. */
    description?: React.ReactNode;
    /** Buttons or a filter at the top right. */
    actions?: React.ReactNode;
    /** A quiet line along the bottom: "Showing 8 of 42". */
    footer?: React.ReactNode;
    /** Drops the body padding so a DataTable runs edge to edge. */
    flush?: boolean;
    /** `inverse` paints the panel near-black, to single out one block on a light page. */
    tone?: 'default' | 'inverse';
}
/** The container for one block of the admin: a chart, a table, a form. */
export declare function Panel(props: PanelProps): React.JSX.Element;

export interface DialogProps {
    open: boolean;
    /** Called by the close button, the Escape key and a click on the scrim. */
    onClose: () => void;
    /** Says what is being decided: "Remove this product?". */
    title: string;
    /** One or two sentences under the title: what happens next. */
    description?: React.ReactNode;
    /** The body: a form, or nothing for a plain confirmation. */
    children?: React.ReactNode;
    /** Buttons, right-aligned. Cancel first, the action last. */
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    /** Fills its nearest positioned ancestor instead of the viewport, and leaves focus alone. For embedding in docs. */
    contained?: boolean;
    /** Accessible name of the close button. */
    closeLabel?: string;
    className?: string;
}
/** A modal for one decision or one short form: confirm a removal, add a product. */
export declare function Dialog(props: DialogProps): React.JSX.Element | null;

export interface AccordionItem {
    id: string;
    /** The question, sentence case. It is the button's label. */
    title: React.ReactNode;
    /** The answer. Pass paragraphs as <p> elements; they are spaced for you. */
    content: React.ReactNode;
}
export interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    items: AccordionItem[];
    /** Ids open at first. Leave `open` out to let the accordion keep its own state. */
    defaultOpen?: string[];
    /** Ids open now, for a controlled accordion. */
    open?: string[];
    /** Called with every id that is open after a question is pressed. */
    onOpenChange?: (open: string[]) => void;
    /** The heading level of each question, to fit the page outline. Default 3. */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
}
/**
 * Questions that open to show their answers: the FAQ. Any number can be open at once, so visitors can compare.
 * Each question is a real button with aria-expanded, tied to its answer. Until the accordion runs in the browser,
 * every answer shows, so the text never depends on a script loading.
 */
export declare function Accordion(props: AccordionProps): React.JSX.Element;

export interface IconProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'name'> {
    /** Glyph name from the Phosphor Bold subset in `assets/Icons`. */
    name: IconName;
    /** Box size in px: 16 inside small controls, 20 by default, 24 standing alone. */
    size?: number;
    /** Accessible name. Leave it out for a decorative icon, which is then hidden from assistive tech. */
    label?: string;
}
/** One Phosphor Bold glyph, drawn inline so it takes the current text color. */
export declare function Icon(props: IconProps): React.JSX.Element;
export declare namespace Icon {
    var names: IconName[];
}

export interface WordmarkProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Two lines, FIT HEALTH over DISTRIBUTION, for narrow columns. */
    stacked?: boolean;
    /** Font size in px. 24 in the nav bar, 20 in the sidebar. */
    size?: number;
    /** The short form, FHD, for spots too tight for the full name. */
    short?: boolean;
}
/** The company name set in Big Shoulders 900. Stands in for a logo until one exists. */
export declare function Wordmark(props: WordmarkProps): React.JSX.Element;

declare global { interface Window { FHD: { Button: typeof Button; Chip: typeof Chip; TextField: typeof TextField; Select: typeof Select; Checkbox: typeof Checkbox; CheckboxGroup: typeof CheckboxGroup; Switch: typeof Switch; Badge: typeof Badge; Alert: typeof Alert; EmptyState: typeof EmptyState; ProductCard: typeof ProductCard; RequestList: typeof RequestList; SpecList: typeof SpecList; PhotoField: typeof PhotoField; StatCard: typeof StatCard; BarChart: typeof BarChart; DataTable: typeof DataTable; InquiryCard: typeof InquiryCard; ContentField: typeof ContentField; Tabs: typeof Tabs; NavBar: typeof NavBar; Sidebar: typeof Sidebar; Panel: typeof Panel; Dialog: typeof Dialog; Accordion: typeof Accordion; Icon: typeof Icon; Wordmark: typeof Wordmark } } }
