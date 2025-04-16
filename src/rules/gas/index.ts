import { explicitUint256Rule } from './explicitUint256Rule';
import { packStorageVariablesRule } from './packStorageVariablesRule';
import { preIncrementRule } from './preIncrementRule';

export { explicitUint256Rule, packStorageVariablesRule, preIncrementRule };
export const gasRules = [
    explicitUint256Rule,
    packStorageVariablesRule,
    preIncrementRule
];