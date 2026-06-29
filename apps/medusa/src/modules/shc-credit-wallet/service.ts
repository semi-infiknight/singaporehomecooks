import { MedusaService } from "@medusajs/framework/utils";
import { CreditWallet } from "./models/credit-wallet";
import { createSHCError } from "@shc/types";

/**
 * shc-credit-wallet module (Phase 9 Home Credits).
 * Balance + tier. Redemption posts ledger "Credit-Redemption" entry for money flow audit.
 * Earning happens on order completed via ledger post + wallet credit (see subscriber/workflow).
 * Use @shc/business-rules for any calc if extended. Rate limits/audits in calling routes.
 */
class ShcCreditWalletModuleService extends MedusaService({ CreditWallet }) {
  private getLogger(container?: any) {
    try { return (container && (container as any).resolve) ? (container as any).resolve("logger") : console; } catch { return console; }
  }

  async getOrCreateWallet(customerId: string): Promise<CreditWallet> {
    const [rows] = await this.listAndCountCreditWallets({ customer_id: customerId } as any, { take: 1 }).catch(() => [[]]);
    if ((rows as CreditWallet[])?.length) return (rows as CreditWallet[])[0];
    const [created] = await this.createCreditWallets([{
      customer_id: customerId,
      balance_cents: 0,
      lifetime_spend_cents: 0,
      tier: "Bronze",
    } as any]);
    return created as unknown as CreditWallet;
  }

  async getBalance(customerId: string): Promise<{ balance: number; lifetimeSpend: number; tier: string; expiryNote: string }> {
    const w = await this.getOrCreateWallet(customerId);
    const tier = w.lifetime_spend_cents > 120000 ? "Gold" : w.lifetime_spend_cents > 45000 ? "Silver" : "Bronze"; // cents based
    return {
      balance: w.balance_cents,
      lifetimeSpend: w.lifetime_spend_cents,
      tier,
      expiryNote: "Credits expire 12 months from earn date. Redeem for S$ value at checkout (4 units ~ S$1).",
    };
  }

  async redeemCredits(customerId: string, amount: number, container?: any): Promise<{ used: number; remaining: number; ledgerPosted: boolean }> {
    const logger = this.getLogger(container);
    const w = await this.getOrCreateWallet(customerId);
    const use = Math.min(amount, w.balance_cents, 20000); // cap for safety
    if (use <= 0) throw createSHCError("SHC-GENERIC-001", "No credits to redeem or invalid amount");

    const before = { balance: w.balance_cents };
    const [updated] = await this.updateCreditWallets({
      selector: { customer_id: customerId },
      data: { balance_cents: w.balance_cents - use, updated_at: new Date() } as any,
    });

    // Tie to ledger for money flow (redemption = credit liability reduction)
    let ledgerPosted = false;
    try {
      const ledgerService = (container as any)?.resolve?.("shcLedger");
      if (ledgerService) {
        // post redemption as special ledger (non-order)
        await ledgerService.postCreditRedemption?.({
          customerId,
          amountCents: use,
          actor: "credit-redeem",
          container,
        });
        ledgerPosted = true;
      }
    } catch (e: any) {
      logger.info?.({ event: "credit.redeem.ledger.skip", error: e.message });
    }

    logger.info?.({ event: "credit.redeem", customer_id: customerId, used: use, before, after: { balance: (updated as any).balance_cents } });

    return { used: use, remaining: (updated as any).balance_cents || (w.balance_cents - use), ledgerPosted };
  }

  // Called from order complete flow to award 5%
  async awardCreditsOnComplete(customerId: string, orderTotalCents: number, orderId: string, container?: any): Promise<{ awarded: number }> {
    const logger = this.getLogger(container);
    if (!customerId || orderTotalCents <= 0) return { awarded: 0 };
    const earned = Math.max(1, Math.floor(orderTotalCents * 0.05 * 4)); // 5% -> units
    const w = await this.getOrCreateWallet(customerId);
    const before = w.balance_cents;
    const newBal = before + earned;
    const newLifetime = w.lifetime_spend_cents + orderTotalCents;
    const tier = newLifetime > 120000 ? "Gold" : newLifetime > 45000 ? "Silver" : "Bronze";
    await this.updateCreditWallets({
      selector: { customer_id: customerId },
      data: {
        balance_cents: newBal,
        lifetime_spend_cents: newLifetime,
        tier,
        last_earn_at: new Date().toISOString(),
        updated_at: new Date(),
      } as any,
    });

    // Post issuance to ledger for audit/money (earnings side)
    try {
      const ledger = (container as any)?.resolve?.("shcLedger");
      if (ledger && ledger.postCreditIssuance) {
        await ledger.postCreditIssuance({ customerId, orderId, amountCents: earned, actor: "order-complete-credit", container });
      }
    } catch {}

    logger.info?.({ event: "credit.award", customer_id: customerId, order_id: orderId, awarded: earned, from: before });
    return { awarded: earned };
  }

  async getHistory(customerId: string, container?: any): Promise<any[]> {
    // History via ledger if available (redemptions + issuances), else stub
    const logger = this.getLogger(container);
    try {
      const ledger = (container as any)?.resolve?.("shcLedger");
      if (ledger) {
        // In full query ledger for Credit* accounts
        return await ledger.listLedgerEntries({ /* filter credit related */ } as any) || [];
      }
    } catch {}
    return [];
  }
}

export default ShcCreditWalletModuleService;
