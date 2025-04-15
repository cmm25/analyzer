import { GasRule } from '../../types/gasRule';
import { explicitUint256Rule } from './explicitUint256Rule';
import { packStorageVariablesRule } from './packStorageVariablesRule';
import { preIncrementRule } from './preIncrementRule';

export const gasRules: GasRule[] = [
    explicitUint256Rule,
    packStorageVariablesRule,
    preIncrementRule
];
