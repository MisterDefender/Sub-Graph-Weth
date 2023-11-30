import { BigInt, Bytes, log, store } from "@graphprotocol/graph-ts"
import {
  Approval as ApprovalEvent,
  Transfer as TransferEvent,
  Deposit as DepositEvent,
  Withdrawal as WithdrawalEvent,
  WETH9 as WethContract,
  DefaultCall__Inputs
} from "../generated/WETH9/WETH9"
import { Approval, Transfer, Deposit, Withdrawal } from '../generated/schema';

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.src = event.params.src
  entity.guy = event.params.guy
  entity.wad = event.params.wad

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Accessign total supply of Weth
  let contract = WethContract.bind(event.address);
  let totalSupplyCallResult = contract.try_totalSupply()
  if (totalSupplyCallResult.reverted) {
    log.info('total supply call reverted', [])
  } else {
    let totalSupply = totalSupplyCallResult.value
    log.info('Total Supply: {}', [totalSupply.toString()])
  }

}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.src = event.params.src
  entity.dst = event.params.dst
  entity.wad = event.params.wad

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDeposit(event: DepositEvent): void {

  let depositorAddress = event.params.dst;
  //Weth contract
  let contract = WethContract.bind(event.address);
  // fetching depositor balance from Weth contract by calling balanceOf() 
  let balanceOfDepositorCall = contract.try_balanceOf(depositorAddress);
  // Asserting call results & storing value
  let balanceOfDepositor: BigInt | null = balanceOfDepositorCall.reverted ? null : balanceOfDepositorCall.value;

  if (balanceOfDepositor !== null && event.params.wad.gt(BigInt.fromI32(0))) {
    // Generating unique deposit ID for depositor using address & balanceOf user
    let depositorID = Bytes.fromHexString(depositorAddress.toHexString() + ":" + balanceOfDepositor.toString());
    //creating new deposit entity for sub graph store
    let depositEntity = new Deposit(depositorID)
    //storing data in entitity
    depositEntity.dst = event.params.dst;
    depositEntity.wad = event.params.wad;
    depositEntity.blockNumber = event.block.number;
    depositEntity.blockTimestamp = event.block.timestamp;
    depositEntity.transactionHash = event.transaction.hash;
    //saving depositEntity
    depositEntity.save();

  }
}

export function handleWithdrawal(event: WithdrawalEvent): void {

  // withdrawer address
  let withdrawerAddress = event.params.src;
  //Weth contract
  let contract = WethContract.bind(event.address);
  // fetching withdrawer balance from Weth contract by calling balanceOf() 
  let balanceOfWithdrawerCall = contract.try_balanceOf(withdrawerAddress);
  let balanceOfWithdrawer: BigInt | null = balanceOfWithdrawerCall.reverted ? null : balanceOfWithdrawerCall.value;
  if (balanceOfWithdrawer !== null && event.params.wad.gt(BigInt.fromI32(0))) {
    let depositorID = Bytes.fromHexString(withdrawerAddress.toHexString() + ":" + balanceOfWithdrawer.toString());
    let withdrawerDeposit: Deposit | null = Deposit.load(depositorID);

    // checks if data exists in graph store
    if (withdrawerDeposit !== null) {
      // checks if withdraw amount matches to deposited amount for deposor ID and removing that deposit log from graph store
      if (withdrawerDeposit.wad.equals(event.params.wad) && withdrawerDeposit.blockTimestamp.lt(event.block.timestamp)) {
        store.remove('depositEntity', depositorID.toString())
      }
      else {
        log.info('Something went wrong, maybe depositor {} not exits for DepositorID', [(event.params.src).toString()])
      }
    }

    // creating withdrawal entity to save in graph store
    let WithdrawalEntity = new Withdrawal(
      event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    WithdrawalEntity.src = event.params.src
    WithdrawalEntity.wad = event.params.wad
    WithdrawalEntity.blockNumber = event.block.number
    WithdrawalEntity.blockTimestamp = event.block.timestamp
    WithdrawalEntity.transactionHash = event.transaction.hash

    // saving withdrawal entity for withdraw() event data
    WithdrawalEntity.save()

  }

}
