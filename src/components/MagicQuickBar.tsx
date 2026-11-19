import { SmartQuickEntry } from './SmartQuickEntry';

export function MagicQuickBar({
  onOpenPricing
}: {
  onOpenPricing: (feature?: string) => void;
}) {
  return <SmartQuickEntry onOpenPricing={onOpenPricing} defaultMode="daily" />;
}
