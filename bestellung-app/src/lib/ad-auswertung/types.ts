export type InvoiceChannel = "agl" | "direct";

/** Where the source tag(s) on an invoice were resolved from. */
export type TagSource = "crm" | "contact" | "auto_kalt_kontakt" | "none";

export type ProcessedInvoice = {
  id: number;
  number: string;
  invoiceDate: string;
  /** Partner on the invoice (AGL or end customer). */
  invoicePartnerName: string;
  channel: InvoiceChannel;
  leasingKunde: string | null;
  endCustomerName: string;
  endCustomerPartnerId: number | null;
  matchScore: number | null;
  unmatched: boolean;
  amountTotal: number;
  amountUntaxed: number;
  taxAmount: number;
  state: string;
  paymentState: string;
  statusLabel: string;
  tags: string[];
  tagSource: TagSource;
  autoAssignedKaltKontakt: boolean;
  crmLeadId: number | null;
  /** Contact has Stichwort „Eigen“ (internal company — excluded from totals unless opted in). */
  isEigenCompany: boolean;
  /** Contact has Stichwort „in Klärung“ (pending case — excluded from totals unless opted in). */
  isInKlaerung: boolean;
};

export type SourceSummary = {
  tag: string;
  invoiceCount: number;
  customerCount: number;
  revenueTotal: number;
  revenueUntaxed: number;
};

export type ChannelSummary = {
  channel: InvoiceChannel;
  label: string;
  invoiceCount: number;
  customerCount: number;
  revenueTotal: number;
  revenueUntaxed: number;
};

export type AdAuswertungResult = {
  invoices: ProcessedInvoice[];
  availableTags: string[];
  unmatchedLeasingCustomers: string[];
  sourceSummary: SourceSummary[];
  channelSummary: ChannelSummary[];
  eigenInvoiceCount: number;
  klaerungInvoiceCount: number;
};

export type CalculationIncludeOptions = {
  includeEigenCompanies: boolean;
  includeInKlaerung: boolean;
};

export type AdAuswertungFilters = {
  dateFrom: string;
  dateTo: string;
  minAmount: number;
  tagFilter: string | null;
  channelFilter: "all" | InvoiceChannel;
};
