import PredictionMarketABI from "./PredictionMarket.json";
import ReputationSystemABI from "./ReputationSystem.json";
import MockERC20ABI from "./MockERC20.json";
import type { Abi } from "viem";

export const PREDICTION_MARKET_ABI = PredictionMarketABI.abi as Abi;
export const REPUTATION_SYSTEM_ABI = ReputationSystemABI.abi as Abi;
export const MOCK_ERC20_ABI = MockERC20ABI.abi as Abi;
