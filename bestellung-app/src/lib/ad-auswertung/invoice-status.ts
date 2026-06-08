const STATE_LABELS: Record<string, string> = {
  draft: "Entwurf",
  posted: "Gebucht",
  cancel: "Storniert",
};

const PAYMENT_LABELS: Record<string, string> = {
  not_paid: "Offen",
  in_payment: "In Zahlung",
  paid: "Bezahlt",
  partial: "Teilweise bezahlt",
  reversed: "Rückgebucht",
  invoicing_legacy: "Offen",
};

export function stateLabel(state: string): string {
  return STATE_LABELS[state] ?? state;
}

export function paymentStateLabel(paymentState: string): string {
  return PAYMENT_LABELS[paymentState] ?? paymentState;
}

export function combinedStatusLabel(state: string, paymentState: string): string {
  const s = stateLabel(state);
  if (state === "posted" && paymentState) {
    return `${s} / ${paymentStateLabel(paymentState)}`;
  }
  return s;
}
