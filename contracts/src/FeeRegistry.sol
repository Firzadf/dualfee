// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FeeRegistry
/// @notice Append-only, public log of DualFee comparisons between Portaldot's
///         EVM (pallet-revive Ethereum RPC) surface and its native Substrate surface.
/// @dev Fees are stored in each surface's own smallest unit (EVM: wei, 18 decimals;
///      native: planck, 14 decimals). No owner, no admin, no funds held.
contract FeeRegistry {
    enum OpType {
        NativeTransfer,
        Erc20Transfer,
        ContractDeploy,
        CustomCalldata
    }

    struct Comparison {
        bytes32 comparisonHash; // keccak256 of the off-chain comparison payload
        OpType opType;
        uint128 evmFeeWei;      // EVM estimate (gasUsed * gasPrice), 18 decimals
        uint128 nativeFeePlanck;// native estimate (partialFee [+ deposit]), 14 decimals
        uint64 timestamp;       // block timestamp at record time
        address recorder;
    }

    Comparison[] private _comparisons;

    event ComparisonRecorded(
        uint256 indexed id,
        bytes32 indexed comparisonHash,
        OpType indexed opType,
        uint128 evmFeeWei,
        uint128 nativeFeePlanck,
        uint64 timestamp,
        address recorder
    );

    error EmptyHash();

    function record(
        bytes32 comparisonHash,
        OpType opType,
        uint128 evmFeeWei,
        uint128 nativeFeePlanck
    ) external returns (uint256 id) {
        if (comparisonHash == bytes32(0)) revert EmptyHash();
        id = _comparisons.length;
        uint64 ts = uint64(block.timestamp);
        _comparisons.push(
            Comparison(comparisonHash, opType, evmFeeWei, nativeFeePlanck, ts, msg.sender)
        );
        emit ComparisonRecorded(id, comparisonHash, opType, evmFeeWei, nativeFeePlanck, ts, msg.sender);
    }

    function count() external view returns (uint256) {
        return _comparisons.length;
    }

    function get(uint256 id) external view returns (Comparison memory) {
        return _comparisons[id];
    }
}
