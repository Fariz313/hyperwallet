import { TrackedWallet } from "../models/TrackedWallet";
import type { TrackedWalletDoc } from "../models/TrackedWallet";
import { WalletFill } from "../models/WalletFill";
import { WalletOrder } from "../models/WalletOrder";
import { WalletPosition } from "../models/WalletPosition";
import { WalletSnapshot } from "../models/WalletSnapshot";
import { normalizeAddress } from "../../lib/hyperliquid/utils";

export interface CreateWalletInput {
  address: string;
  label?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateWalletInput {
  label?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface WalletListItem {
  address: string;
  label?: string;
  tags: string[];
  isActive: boolean;
  syncStatus: string;
  lastSyncedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

function walletToListItem(wallet: TrackedWalletDoc): WalletListItem {
  return {
    address: wallet.address,
    label: wallet.label,
    tags: wallet.tags,
    isActive: wallet.isActive,
    syncStatus: wallet.syncStatus,
    lastSyncedAt: wallet.lastSyncedAt?.toISOString(),
    lastError: wallet.lastError,
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString(),
  };
}

export class WalletsService {
  async listWallets(): Promise<WalletListItem[]> {
    const wallets = await TrackedWallet.find({})
      .sort({ isActive: -1, lastSyncedAt: -1, updatedAt: -1 })
      .lean();

    return wallets.map((wallet) => ({
      address: wallet.address,
      label: wallet.label,
      tags: wallet.tags,
      isActive: wallet.isActive,
      syncStatus: wallet.syncStatus,
      lastSyncedAt: wallet.lastSyncedAt?.toISOString(),
      lastError: wallet.lastError,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
    }));
  }

  async createWallet(input: CreateWalletInput): Promise<WalletListItem> {
    const address = normalizeAddress(input.address);

    try {
      const wallet = await TrackedWallet.create({
        address,
        label: input.label?.trim() || undefined,
        tags: input.tags ?? [],
        isActive: input.isActive ?? true,
        syncStatus: "idle",
      });

      return walletToListItem(wallet);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("E11000 duplicate key")
      ) {
        const wallet = await TrackedWallet.findOne({ address }).lean();

        if (!wallet) {
          throw error;
        }

        return walletToListItem(wallet);
      }

      throw error;
    }
  }

  async updateWallet(
    address: string,
    input: UpdateWalletInput,
  ): Promise<WalletListItem> {
    const normalizedAddress = normalizeAddress(address);
    const wallet = await TrackedWallet.findOneAndUpdate(
      { address: normalizedAddress },
      {
        ...(input.label !== undefined
          ? { label: input.label.trim() || undefined }
          : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      { new: true, runValidators: true },
    );

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    return walletToListItem(wallet);
  }

  async deleteWallet(
    address: string,
  ): Promise<{ deleted: boolean; address: string }> {
    const normalizedAddress = normalizeAddress(address);
    const result = await TrackedWallet.deleteOne({
      address: normalizedAddress,
    });

    return {
      deleted: result.deletedCount > 0,
      address: normalizedAddress,
    };
  }
}

export const walletsService = new WalletsService();
