// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GeneratedType, Registry, decodeTxRaw } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import {
  SubqlCosmosMessageFilter,
  SubqlCosmosEventFilter,
  CosmosBlock,
  CosmosTransaction,
  CosmosMessage,
  CosmosEvent,
} from '@subql/types-cosmos';
import {
  MsgClearAdmin,
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgMigrateContract,
  MsgStoreCode,
  MsgUpdateAdmin,
} from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { CosmosClient } from '../indexer/api.service';
import { filterMessageData, filterEvent } from './cosmos';

const ENDPOINT = 'https://rpc-juno.itastakers.com/';
const CHAINID = 'juno-1';

const TEST_BLOCKNUMBER = 3266772;

const TEST_MESSAGE_FILTER_TRUE: SubqlCosmosMessageFilter = {
  type: '/cosmwasm.wasm.v1.MsgExecuteContract',
  contractCall: 'swap',
  values: {
    sender: 'juno16z990xkfph8vh4wx906k5jzergr4t9fg9sr3y6',
    contract: 'juno1e8n6ch7msks487ecznyeagmzd5ml2pq9tgedqt2u63vra0q0r9mqrjy6ys',
  },
};

const TEST_MESSAGE_FILTER_FALSE: SubqlCosmosMessageFilter = {
  type: '/cosmwasm.wasm.v1.MsgExecuteContract',
  contractCall: 'increment',
  values: {
    sender: 'juno16z990xkfph8vh4wx906k5jzergr4t9fg9sr3y6',
    contract: 'juno1e8n6ch7msks487ecznyeagmzd5ml2pq9tgedqt2u63vra0q0r9mqrjy6ys',
  },
};

describe('CosmosUtils', () => {
  let api: CosmosClient;
  let decodedTx;
  beforeAll(async () => {
    const client = await CosmWasmClient.connect(ENDPOINT);
    const wasmTypes: ReadonlyArray<[string, GeneratedType]> = [
      ['/cosmwasm.wasm.v1.MsgClearAdmin', MsgClearAdmin],
      ['/cosmwasm.wasm.v1.MsgExecuteContract', MsgExecuteContract],
      ['/cosmwasm.wasm.v1.MsgMigrateContract', MsgMigrateContract],
      ['/cosmwasm.wasm.v1.MsgStoreCode', MsgStoreCode],
      ['/cosmwasm.wasm.v1.MsgInstantiateContract', MsgInstantiateContract],
      ['/cosmwasm.wasm.v1.MsgUpdateAdmin', MsgUpdateAdmin],
    ];

    const registry = new Registry([...defaultRegistryTypes, ...wasmTypes]);
    api = new CosmosClient(client, registry);
    const txInfos = await api.txInfoByHeight(TEST_BLOCKNUMBER);
    const txInfo = txInfos.find(
      (txInfo) =>
        txInfo.hash ===
        '1A796F30DD866CA2E9A866084CB10BF13B5F6502256D6503E8B1BAC358B15701',
    );
    decodedTx = decodeTxRaw(txInfo.tx);
  });

  it('filter message data for true', () => {
    const decodedMsg = api.decodeMsg(decodedTx.body.messages[0]);
    const msg: CosmosMessage = {
      idx: 0,
      block: {} as CosmosBlock,
      tx: {} as CosmosTransaction,
      msg: {
        typeUrl: decodedTx.body.messages[0].typeUrl,
        ...decodedMsg,
      },
    };
    const result = filterMessageData(msg, TEST_MESSAGE_FILTER_TRUE);
    expect(result).toEqual(true);
  });

  it('filter message data for false', () => {
    const decodedMsg = api.decodeMsg(decodedTx.body.messages[0]);
    const msg: CosmosMessage = {
      idx: 0,
      block: {} as CosmosBlock,
      tx: {} as CosmosTransaction,
      msg: {
        typeUrl: decodedTx.body.messages[0].typeUrl,
        ...decodedMsg,
      },
    };
    const result = filterMessageData(msg, TEST_MESSAGE_FILTER_FALSE);
    expect(result).toEqual(false);
  });
});
