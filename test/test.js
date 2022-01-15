const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const hre = require("hardhat");
chai.use(chaiAsPromised);
const expect = chai.expect;
const { ethers } = require("hardhat");
const initialEtnaTransfer = 50000;
const batchLimit = 50;
const zeroAddress = '0x0000000000000000000000000000000000000000';
let signers, tokensArray, etnaContract, nEtnaContract, collateralContract, marketplaceContract,
  nftContract, borrowing1Contract, borrowing2Contract, nftCollateralContract, blContract,
  result;

beforeEach(async function () {
  signers = await ethers.getSigners();

  const ERC20 = await ethers.getContractFactory("BEP20Token");
  etnaContract = await ERC20.deploy(
    signers[10].address, 'ETNA', 'ETNA', ethers.utils.parseUnits('1000000'), 18
  );
  await etnaContract.deployed();

  await etnaContract.connect(signers[10])
    .transfer(signers[0].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[10])
    .transfer(signers[1].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[10])
    .transfer(signers[2].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[10])
    .transfer(signers[3].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[10])
    .transfer(signers[4].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  nEtnaContract = await ERC20.deploy(
    signers[10].address, 'NETNA', 'NETNA', ethers.utils.parseUnits('1000000'), 18
  );
  await nEtnaContract.deployed();

  collateralContract = await ERC20.deploy(
    signers[10].address, 'TEST', 'TEST', ethers.utils.parseUnits('1000000'), 18
  );
  await collateralContract.deployed();

  await collateralContract.connect(signers[10])
    .transfer(signers[0].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await collateralContract.connect(signers[10])
    .transfer(signers[1].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await collateralContract.connect(signers[10])
    .transfer(signers[2].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await collateralContract.connect(signers[10])
    .transfer(signers[3].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await collateralContract.connect(signers[10])
    .transfer(signers[4].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  borrowing1Contract = await ERC20.deploy(
    signers[10].address, 'BUSD', 'BUSD', ethers.utils.parseUnits('1000000'), 18
  );
  await borrowing1Contract.deployed();

  await borrowing1Contract.connect(signers[10])
    .transfer(signers[0].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing1Contract.connect(signers[10])
    .transfer(signers[1].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing1Contract.connect(signers[10])
    .transfer(signers[2].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing1Contract.connect(signers[10])
    .transfer(signers[3].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing1Contract.connect(signers[10])
    .transfer(signers[4].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing1Contract.connect(signers[10])
    .transfer(signers[7].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  borrowing2Contract = await ERC20.deploy(
    signers[10].address, 'BUSD', 'BUSD', ethers.utils.parseUnits('1000000'), 18
  );
  await borrowing2Contract.deployed();

  await borrowing2Contract.connect(signers[10])
    .transfer(signers[0].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing2Contract.connect(signers[10])
    .transfer(signers[1].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing2Contract.connect(signers[10])
    .transfer(signers[2].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing2Contract.connect(signers[10])
    .transfer(signers[3].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing2Contract.connect(signers[10])
    .transfer(signers[4].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  const BorrowingLending = await ethers.getContractFactory("BorrowingLending");
  blContract = await BorrowingLending.connect(signers[10]).deploy(
    etnaContract.address,
    signers[10].address, // owner
    2000,
    4000,
    500,
    1000,
    3000
  );
  await blContract.deployed();

  await etnaContract.connect(signers[0])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[1])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[2])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[3])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[4])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[10])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  await collateralContract.connect(signers[0])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await collateralContract.connect(signers[1])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await collateralContract.connect(signers[2])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await collateralContract.connect(signers[3])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await collateralContract.connect(signers[4])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await collateralContract.connect(signers[10])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  await borrowing1Contract.connect(signers[0])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing1Contract.connect(signers[1])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing1Contract.connect(signers[2])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing1Contract.connect(signers[3])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing1Contract.connect(signers[4])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing1Contract.connect(signers[7])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  await borrowing2Contract.connect(signers[0])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing2Contract.connect(signers[1])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing2Contract.connect(signers[2])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing2Contract.connect(signers[3])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await borrowing2Contract.connect(signers[4])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  await blContract.connect(signers[10]).addToManagers(signers[9].address);
  await expect(
    blContract.connect(signers[0]).addBorrowingProfile(borrowing1Contract.address, 100)
  ).to.be.revertedWith('63');
  const borrowing1ProfileUsdRate = 10000;
  const borrowing2ProfileUsdRate = 10000;
  const collateral1ProfileUsdRate = 5000;
  const collateral1ProfileBorrowingFactor = 2500;
  const collateral1ProfileLiquidationFactor = 2500;
  const collateral2ProfileUsdRate = 2000;
  const collateral2ProfileBorrowingFactor = 1500;
  const collateral2ProfileLiquidationFactor = 2000;
  const collateral3ProfileUsdRate = 6000000;
  const collateral3ProfileBorrowingFactor = 5000;
  const collateral3ProfileLiquidationFactor = 1500;
  const collateral4ProfileUsdRate = 2000;
  const collateral4ProfileBorrowingFactor = 1500;
  const collateral4ProfileLiquidationFactor = 2000;
  await blContract.connect(signers[9])
    .addBorrowingProfile(borrowing1Contract.address, borrowing1ProfileUsdRate);
  await blContract.connect(signers[9])
    .addBorrowingProfile(borrowing2Contract.address, borrowing2ProfileUsdRate);
  await blContract.connect(signers[9]).addCollateralProfile(
    collateralContract.address, collateral1ProfileUsdRate,
    collateral1ProfileBorrowingFactor, collateral1ProfileLiquidationFactor
  );
  await blContract.connect(signers[9]).addCollateralProfile(
    etnaContract.address, collateral2ProfileUsdRate,
    collateral2ProfileBorrowingFactor, collateral2ProfileLiquidationFactor
  );
  await blContract.connect(signers[9]).addCollateralProfile(
    zeroAddress, collateral3ProfileUsdRate,
    collateral3ProfileBorrowingFactor, collateral3ProfileLiquidationFactor
  );
  await blContract.connect(signers[9]).setNEtnaContract(nEtnaContract.address);
  await blContract.connect(signers[9]).addCollateralProfile(
    nEtnaContract.address, collateral4ProfileUsdRate,
    collateral4ProfileBorrowingFactor, collateral4ProfileLiquidationFactor
  );

  result = await blContract.getBorrowingProfilesNumber();
  expect(Number(result)).to.equal(2);
  result = await blContract.getCollateralProfilesNumber();
  expect(Number(result)).to.equal(4);
  result = await blContract.getBorrowingProfile(1);
  expect(result.contractAddress).to.equal(borrowing1Contract.address);
  expect(Number(result.usdRate)).to.equal(borrowing1ProfileUsdRate);
  expect(Number(result.totalBorrowed)).to.equal(0);
  expect(Number(result.totalLent)).to.equal(0);
  expect(result.active).to.be.true;

  result = await blContract.getBorrowingProfile(2);
  expect(result.contractAddress).to.equal(borrowing2Contract.address);
  expect(Number(result.usdRate)).to.equal(borrowing2ProfileUsdRate);
  expect(Number(result.totalBorrowed)).to.equal(0);
  expect(Number(result.totalLent)).to.equal(0);
  expect(result.active).to.be.true;

  result = await blContract.getCollateralProfile(1);
  expect(result.contractAddress).to.equal(collateralContract.address);
  expect(Number(result.usdRate)).to.equal(collateral1ProfileUsdRate);
  expect(Number(result.borrowingFactor)).to.equal(collateral1ProfileBorrowingFactor);
  expect(Number(result.liquidationFactor)).to.equal(collateral1ProfileLiquidationFactor);
  expect(Number(result.total)).to.equal(0);
  expect(Number(result.collateralType)).to.equal(1);
  expect(result.active).to.be.true;

  result = await blContract.getCollateralProfile(2);
  expect(result.contractAddress).to.equal(etnaContract.address);
  expect(Number(result.usdRate)).to.equal(collateral2ProfileUsdRate);
  expect(Number(result.borrowingFactor)).to.equal(collateral2ProfileBorrowingFactor);
  expect(Number(result.liquidationFactor)).to.equal(collateral2ProfileLiquidationFactor);
  expect(Number(result.total)).to.equal(0);
  expect(Number(result.collateralType)).to.equal(2);
  expect(result.active).to.be.true;

  result = await blContract.getCollateralProfile(3);
  expect(result.contractAddress).to.equal(zeroAddress);
  expect(Number(result.usdRate)).to.equal(collateral3ProfileUsdRate);
  expect(Number(result.borrowingFactor)).to.equal(collateral3ProfileBorrowingFactor);
  expect(Number(result.liquidationFactor)).to.equal(collateral3ProfileLiquidationFactor);
  expect(Number(result.total)).to.equal(0);
  expect(Number(result.collateralType)).to.equal(0);
  expect(result.active).to.be.true;

  result = await blContract.getCollateralProfile(4);
  expect(result.contractAddress).to.equal(nEtnaContract.address);
  expect(Number(result.usdRate)).to.equal(collateral4ProfileUsdRate);
  expect(Number(result.borrowingFactor)).to.equal(collateral4ProfileBorrowingFactor);
  expect(Number(result.liquidationFactor)).to.equal(collateral4ProfileLiquidationFactor);
  expect(Number(result.total)).to.equal(0);
  expect(Number(result.collateralType)).to.equal(3);
  expect(result.active).to.be.true;

  const Nft = await ethers.getContractFactory("CyclopsTokens");
  nftContract = await Nft.connect(signers[10]).deploy();
  await nftContract.deployed();

  const Marketplace = await ethers.getContractFactory("NFTMarketplace");
  marketplaceContract = await Marketplace.connect(signers[10]).deploy(nftContract.address, etnaContract.address, 0);
  await marketplaceContract.deployed();

  const NftCollateral = await ethers.getContractFactory("NftCollateral");
  await expect(
    NftCollateral.connect(signers[10]).deploy(
      nEtnaContract.address,
      marketplaceContract.address,
      nftContract.address,
      blContract.address,
      signers[10].address,
      3
    )
  ).to.be.revertedWith('Wrong NETNA collateral profile index');
  nftCollateralContract = await NftCollateral.connect(signers[10]).deploy(
    nEtnaContract.address,
    marketplaceContract.address,
    nftContract.address,
    blContract.address,
    signers[10].address,
    4
  );
  await nftCollateralContract.deployed();

  await expect(
    nftCollateralContract.connect(signers[10]).setNEtnaProfileIndex(3)
  ).to.be.revertedWith('Wrong NETNA collateral profile index');

  const totalSupply = await nEtnaContract.totalSupply();
  await nEtnaContract.connect(signers[10])
    .transfer(nftCollateralContract.address, totalSupply);

  await blContract.connect(signers[9])
    .setNftCollateralContract(nftCollateralContract.address);

  await nftContract.connect(signers[10]).transferPublishRight(marketplaceContract.address);
  await etnaContract.connect(signers[0]).approve(marketplaceContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[1]).approve(marketplaceContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[2]).approve(marketplaceContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  await marketplaceContract.connect(signers[10]).setExternalPriceCurve();
  await marketplaceContract.connect(signers[10]).addNFTProfile(
    1, ethers.utils.parseUnits('11'), ethers.utils.parseUnits('10'), 'https://test/1', 1000
  );

  await marketplaceContract.connect(signers[10]).addNFTProfile(
    2, ethers.utils.parseUnits('22'), ethers.utils.parseUnits('20'), 'https://test/2', 1000
  );
  await marketplaceContract.connect(signers[10]).addNFTProfile(
    3, ethers.utils.parseUnits('33'), ethers.utils.parseUnits('30'), 'https://test/3', 1000
  );

  await marketplaceContract.connect(signers[0]).buyNFT(1);
  await marketplaceContract.connect(signers[0]).buyNFT(2);
  await marketplaceContract.connect(signers[0]).buyNFT(3);

  await marketplaceContract.connect(signers[1]).buyNFT(1);
  await marketplaceContract.connect(signers[1]).buyNFT(2);
  await marketplaceContract.connect(signers[1]).buyNFT(3);

  tokensArray = [];
  for (let i = 7; i <= 7 + batchLimit - 1; i ++) {
    let profileId = 1;
    if (i < 10) profileId = 3;
    else if (i < 13) profileId = 2;
    await marketplaceContract.connect(signers[2]).buyNFT(profileId);
    tokensArray.push(i);
  }
  
  await nftContract.connect(signers[0]).setApprovalForAll(
    nftCollateralContract.address, true
  );
  await nftContract.connect(signers[1]).setApprovalForAll(
    nftCollateralContract.address, true
  );
  await nftContract.connect(signers[2]).setApprovalForAll(
    nftCollateralContract.address, true
  );
});

describe("Testing contract", function () {
  it("Lending", async function () {
    const lending11Amount = 100;
    const lending11WithdrawnAmount = 100;
    const lending21Amount = 150;
    const lending321Amount = 200;
    const lending322Amount = 250;
    const lending323Amount = 300;
    const lending321WithdrawnAmount = 220;
    const lending322WithdrawnAmount = 70;
    const borrowing2CollateralAmount = 20000;
    const borrowing2Amount = 300;
    result = await blContract.getLendingsNumber();
    expect(Number(result)).to.equal(0);
    await blContract.connect(signers[0]).lend(1, ethers.utils.parseUnits(lending11Amount.toString()));
    result = await blContract.getLendingsNumber();
    expect(Number(result)).to.equal(1);
    result = await blContract.getLending(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(lending11Amount);
    expect(Number(ethers.utils.formatUnits(result.accumulatedYield))).to.equal(0);
    await blContract.connect(signers[1]).lend(1, ethers.utils.parseUnits(lending21Amount.toString()));
    result = await blContract.getLendingsNumber();
    expect(Number(result)).to.equal(2);
    await blContract.connect(signers[0]).lend(2, ethers.utils.parseUnits(lending321Amount.toString()));
    result = await blContract.getLendingsNumber();
    expect(Number(result)).to.equal(3);
    await blContract.connect(signers[0]).lend(2, ethers.utils.parseUnits(lending322Amount.toString()));
    result = await blContract.getLendingsNumber();
    expect(Number(result)).to.equal(3);
    result = await blContract.getLending(2);
    expect(result.userAddress).to.equal(signers[1].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(lending21Amount);
    expect(Number(ethers.utils.formatUnits(result.accumulatedYield))).to.equal(0);
    result = await blContract.getLending(3);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(2);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(lending321Amount + lending322Amount);
    const lending321Apr = Number(await blContract.getLendingApr(2)) / 10000;

    await hre.timeAndMine.increaseTime('100 days');

    await blContract.connect(signers[0]).lend(2, ethers.utils.parseUnits(lending323Amount.toString()));
    const lending322Apr = Number(await blContract.getLendingApr(2)) / 10000;
    result = await blContract.getAprSettings();
    const minLendingApr = Number(result.aprLendingMin) / 100;
    const lending11ExpectedYield = lending11Amount * minLendingApr / 100 * 100 / 365;
    result = await blContract.getLendingYield(1, true);
    expect(roundTo(Number(ethers.utils.formatUnits(result)), 4)).to
      .equal(roundTo(lending11ExpectedYield, 4));
    const lending21ExpectedYield = lending21Amount * minLendingApr / 100 * 100 / 365;
    result = await blContract.getLendingYield(2, true);
    expect(roundTo(Number(ethers.utils.formatUnits(result)), 4)).to
      .equal(roundTo(lending21ExpectedYield, 4));
    const lending321ExpectedYield = (lending321Amount + lending322Amount)
      * minLendingApr / 100 * 100 / 365;

    result = await blContract.getLending(3);
    expect(Number(ethers.utils.formatUnits(result.amount))).to
      .equal(roundTo(lending321Amount + lending322Amount + lending323Amount, 4));
    expect(roundTo(Number(ethers.utils.formatUnits(result.accumulatedYield)), 4)).to
      .equal(roundTo(lending321ExpectedYield, 4));
    result = await blContract.getLendingYield(3, true);
    expect(roundTo(
      Number(ethers.utils.formatUnits(result)), 4
    )).to.equal(roundTo(lending321ExpectedYield, 4));

    const borrowing1S0Balance = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(signers[0].address)
    ));
    const borrowing2S0Balance = Number(ethers.utils.formatUnits(
      await borrowing2Contract.balanceOf(signers[0].address)
    ));
    await blContract.connect(signers[2]).depositCollateral(
      2, ethers.utils.parseUnits(borrowing2CollateralAmount.toString())
    );
    await blContract.connect(signers[2]).borrow(
      2, ethers.utils.parseUnits(borrowing2Amount.toString()), false
    );
    const lending323Apr = Number(await blContract.getLendingApr(2)) / 10000;

    await blContract.connect(signers[0]).withdrawLending(
      1, ethers.utils.parseUnits(lending11WithdrawnAmount.toString())
    );
    result = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(signers[0].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(
    borrowing1S0Balance + lending11WithdrawnAmount, 4
    ));
    await blContract.connect(signers[0]).withdrawLendingYield(
      1, ethers.utils.parseUnits(lending11ExpectedYield.toString())
    );
    result = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(signers[0].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(
    borrowing1S0Balance + lending11WithdrawnAmount
      + lending11ExpectedYield, 4
    ));
    await blContract.connect(signers[0]).withdrawLending(
      2, ethers.utils.parseUnits(lending321WithdrawnAmount.toString())
    );
    const lending324Apr = Number(await blContract.getLendingApr(2)) / 10000;

    result = Number(ethers.utils.formatUnits(
      await borrowing2Contract.balanceOf(signers[0].address)
    ));
    expect(roundTo(result, 4)).to.equal(
      roundTo(borrowing2S0Balance + lending321WithdrawnAmount, 4)
    );

    result = await blContract.getBorrowing(1);
    expect(result.userAddress).to.equal(signers[2].address);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(borrowing2Amount);
    result = await blContract.getLending(1);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(0);
    result = await blContract.getLending(3);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(
      lending321Amount + lending322Amount + lending323Amount - lending321WithdrawnAmount
    );

    await hre.timeAndMine.increaseTime('100 days');

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const lending322ExpectedYield =
      (lending321Amount + lending322Amount) * lending321Apr * 100 / 365
      + (
          lending321Amount + lending322Amount + lending323Amount - lending321WithdrawnAmount
        ) * lending324Apr * 100 / 365;

    result = await blContract.getLendingYield(3, true);
    expect(roundTo(Number(ethers.utils.formatUnits(result)), 4)).to.equal(
      roundTo(lending322ExpectedYield, 4)
    );
    result = await blContract.getLending(3);
    expect(roundTo(Number(ethers.utils.formatUnits(result.accumulatedYield)), 4)).to.equal(
      roundTo(lending321ExpectedYield, 4)
    );

    await blContract.connect(signers[0]).withdrawLending(
      2, ethers.utils.parseUnits(lending322WithdrawnAmount.toString())
    );

    result = await blContract.getLending(3);
    expect(roundTo(Number(ethers.utils.formatUnits(result.accumulatedYield)), 4)).to.equal(
      roundTo(lending322ExpectedYield, 4)
    );

    result = await blContract.getLendingYield(3, true);
    expect(roundTo(Number(ethers.utils.formatUnits(result)), 4)).to.equal(
      roundTo(lending322ExpectedYield, 4)
    );
    result = await blContract.getLending(3);
    expect(roundTo(Number(ethers.utils.formatUnits(result.amount)), 4)).to.equal(roundTo(
      lending321Amount + lending322Amount + lending323Amount
      - lending321WithdrawnAmount - lending322WithdrawnAmount, 4
    ));
    expect(roundTo(Number(ethers.utils.formatUnits(result.accumulatedYield)), 4)).to.equal(
      roundTo(lending322ExpectedYield, 4)
    );

    await blContract.connect(signers[0]).withdrawLendingYield(
      2, ethers.utils.parseUnits((lending322ExpectedYield * 0.2).toString())
    );
    result = await blContract.getLending(3);
    expect(roundTo(Number(ethers.utils.formatUnits(result.amount)), 4)).to.equal(roundTo(
      lending321Amount + lending322Amount + lending323Amount
      - lending321WithdrawnAmount - lending322WithdrawnAmount, 4
    ));
    expect(roundTo(Number(ethers.utils.formatUnits(result.accumulatedYield)), 3)).to.equal(
      roundTo(lending322ExpectedYield * 0.8, 3)
    );
    result = Number(ethers.utils.formatUnits(
      await blContract.getLendingYield(3, true)
    ));
    expect(roundTo(result, 3)).to.equal(
      roundTo(lending322ExpectedYield * 0.8, 3)
    );
    const l3Yield = result;
    result = await blContract.getLending(3);
    const l3amount = Number(ethers.utils.formatUnits(
      result.amount
    ));
    await blContract.connect(signers[0]).compound(2);
    result = await blContract.getLending(3);
    expect(roundTo(Number(ethers.utils.formatUnits(
      result.amount
    )), 4)).to.equal(roundTo(l3amount + l3Yield, 4));

    expect(roundTo(Number(ethers.utils.formatUnits(
      result.accumulatedYield
    )), 4)).to.equal(0);

    result = Number(ethers.utils.formatUnits(
      await blContract.getLendingYield(3, true)
    ));

    expect(roundTo(result, 4)).to.equal(0);

    result = await blContract.getTotalUsers();
    expect(result).to.equal(3);
  });

  it("Borrowing", async function () {
    result = await borrowing1Contract.balanceOf(blContract.address);
    let balanceBlBorrowing1Contract = Number(ethers.utils.formatUnits(result));
    result = await collateralContract.balanceOf(blContract.address);
    let balanceBlCollateralContract = Number(ethers.utils.formatUnits(result));

    const lendingAmount = 8000;
    const lendingAmount2 = 1000;
    const borrowingAmount = 100;
    const toBeReturned = 50;
    const collateralAmount = 5000;

    await blContract.connect(signers[0]).lend(1, ethers.utils.parseUnits(lendingAmount.toString()));

    result = await borrowing1Contract.balanceOf(blContract.address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceBlBorrowing1Contract + lendingAmount);

    result = await blContract.getBorrowingApr(1);
    expect(Number(result)).to.equal(2000);
    result = await blContract.getLendingApr(1);
    expect(Number(result)).to.equal(1000);

    result = await borrowing1Contract.balanceOf(signers[1].address);
    let balanceS1Borrowing1Contract = Number(ethers.utils.formatUnits(result));
    result = await collateralContract.balanceOf(signers[1].address);
    let balanceS1CollateralContract = Number(ethers.utils.formatUnits(result));


    await blContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateralAmount.toString()));

    result = await blContract.getCollateralProfile(1);
    let usdRate = Number(result.usdRate) / 10000;
    let borrowingFactor = Number(result.borrowingFactor) / 10000;
    let availableBorrowingAmount = collateralAmount * usdRate * borrowingFactor;
    expect(Number(ethers.utils.formatUnits(result.total))).to.equal(collateralAmount);

    result = await blContract.getCollateral(1);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(collateralAmount);
    result = await blContract.getAvailableBorrowingAmount(signers[1].address, 1);
    expect(Number(ethers.utils.formatUnits(result))).to.equal(availableBorrowingAmount);

    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowingAmount.toString()), false);
    result = await borrowing1Contract.balanceOf(signers[1].address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceS1Borrowing1Contract + borrowingAmount);
    result = await borrowing1Contract.balanceOf(blContract.address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceBlBorrowing1Contract + lendingAmount - borrowingAmount);
    result = await collateralContract.balanceOf(signers[1].address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceS1CollateralContract - collateralAmount);
    result = await collateralContract.balanceOf(blContract.address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceBlCollateralContract + collateralAmount);
    result = await blContract.getBorrowing(1);
    expect(result.userAddress).to.equal(signers[1].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(borrowingAmount);
    expect(Number(ethers.utils.formatUnits(result.accumulatedFee))).to.equal(0);
    result = await blContract.getCollateral(1);
    expect(Number(result.collateralProfileIndex)).to.equal(1);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(collateralAmount);

    result = await blContract.getAprSettings();
    const borrowingPercentage = borrowingAmount / 8000;
    const minBorrowingApr = Number(result.aprBorrowingMin) / 100;
    const maxBorrowingApr = Number(result.aprBorrowingMax) / 100;
    const minLendingApr = Number(result.aprLendingMin) / 100;
    const maxLendingApr = Number(result.aprLendingMax) / 100;
    const expectedBorrowingApr = Math.floor(
      (minBorrowingApr + borrowingPercentage / 0.95 * (maxBorrowingApr - minBorrowingApr)) * 100
    );
    const expectedLendingApr = Math.floor(
      (minLendingApr + borrowingPercentage / 0.95 * (maxLendingApr - minLendingApr)) * 100
    );

    result = await blContract.getBorrowingApr(1);
    expect(Number(result)).to.equal(expectedBorrowingApr);
    result = await blContract.getLendingApr(1);
    expect(Number(result)).to.equal(expectedLendingApr);

    await hre.timeAndMine.increaseTime('100 days');

    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount2.toString()));
    result = await blContract.getBorrowing(1);
    expect(Number(ethers.utils.formatUnits(result.accumulatedFee))).to.equal(0);
    result = await blContract.getBorrowingFee(1, true);
    const expectedBorrowingFee = borrowingAmount * expectedBorrowingApr / 10000 * 100 / 365;
    expect(roundTo(expectedBorrowingFee, 4)).to
      .equal(roundTo(Number(ethers.utils.formatUnits(result)), 4));

    await blContract.connect(signers[1])
      .returnBorrowing(1, ethers.utils.parseUnits(toBeReturned.toString()));
    result = await blContract.getBorrowing(1);
    expect(Number(ethers.utils.formatUnits(result.amount))).to
      .equal(borrowingAmount - toBeReturned);
    expect(roundTo(Number(ethers.utils.formatUnits(result.accumulatedFee)), 4)).to
      .equal(roundTo(expectedBorrowingFee, 4));

    result = await collateralContract.balanceOf(signers[1].address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceS1CollateralContract - collateralAmount);
    result = await collateralContract.balanceOf(blContract.address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceBlCollateralContract + collateralAmount);
    result = await borrowing1Contract.balanceOf(signers[1].address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceS1Borrowing1Contract + borrowingAmount - toBeReturned);
    result = await borrowing1Contract.balanceOf(blContract.address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceBlBorrowing1Contract + lendingAmount - borrowingAmount + lendingAmount2 + toBeReturned);

    result = await blContract.getAvailableCollateralAmount(signers[0].address, 1);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(0);
    const availableCollateralAmount = Number(ethers.utils.formatUnits(
      await blContract.getAvailableCollateralAmount(signers[1].address, 1)
    ));
    const expectedAvailableCollateralAmount = collateralAmount - (borrowingAmount - toBeReturned + expectedBorrowingFee) / usdRate / borrowingFactor;
    expect(roundTo(availableCollateralAmount, 4)).to
      .equal(roundTo(expectedAvailableCollateralAmount, 4));

    await expect(
      blContract.connect(signers[1])
        .withdrawCollateral(1, ethers.utils.parseUnits((availableCollateralAmount + 1).toString()))
    ).to.be.revertedWith('30');

    const collateral1S1Balance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[1].address)
    ));
    const collateral1BlBalance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));

    await blContract.connect(signers[1])
      .withdrawCollateral(
        1, ethers.utils.parseUnits(
          (availableCollateralAmount / 2).toString()
        )
      );

    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[1].address)
    ));
    expect(result).to.equal(collateral1S1Balance + availableCollateralAmount / 2);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(collateral1BlBalance - availableCollateralAmount / 2);

    result = await blContract.getAvailableCollateralAmount(signers[1].address, 1);
    expect(roundTo(Number(ethers.utils.formatUnits(result)), 3)).to
      .equal(roundTo(availableCollateralAmount / 2, 3));

    await blContract.connect(signers[1])
      .withdrawWholeCollateral(1);

    result = await blContract.getAvailableCollateralAmount(signers[1].address, 1);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(0);

    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[1].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1S1Balance + availableCollateralAmount, 4));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1BlBalance - availableCollateralAmount, 4));

    result = await collateralContract.balanceOf(signers[1].address);
    expect(roundTo(
      Number(ethers.utils.formatUnits(result)), 4
    )).to.equal(roundTo(
      balanceS1CollateralContract - collateralAmount + expectedAvailableCollateralAmount, 4
    ));
    result = await collateralContract.balanceOf(blContract.address);
    expect(roundTo(
      Number(ethers.utils.formatUnits(result)), 4
    )).to
      .equal(roundTo(
      balanceBlCollateralContract + collateralAmount - expectedAvailableCollateralAmount, 4
    ));
  });

  it("Combined collateral borrowing", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 500;
    const borrowing2Amount = 500;
    const collateral1Amount = 5000;
    const collateral2Amount = 5000;
    const collateral3Amount = 1000;
    const collateralWithdraw = 100;
    const ethS1Balance = Number(ethers.utils.formatUnits(await signers[1].getBalance()));
    result = await blContract.getCollateralProfile(1);
    const collateral1UsdRate = Number(result.usdRate) / 10000;
    const collateral1BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateral1BorrowingCapacity = collateral1Amount * collateral1UsdRate
      * collateral1BorrowingFactor;
    result = await blContract.getCollateralProfile(2);
    const collateral2UsdRate = Number(result.usdRate) / 10000;
    const collateral2BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateral2BorrowingCapacity = collateral2Amount * collateral2UsdRate
      * collateral2BorrowingFactor;
    result = await blContract.getCollateralProfile(3);
    const collateral3UsdRate = Number(result.usdRate) / 10000;
    const collateral3BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateral3BorrowingCapacity = collateral3Amount * collateral3UsdRate
      * collateral3BorrowingFactor;

    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString()));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await blContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await blContract.connect(signers[1])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );

    const collateral1S2Balance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[2].address)
    ));
    const collateral1BlBalance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    const collateral2S2Balance = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[2].address)
    ));
    const collateral2BlBalance = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(blContract.address)
    ));
    const collateral3S2Balance = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(signers[2].address)
    ));
    const collateral3BlBalance = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(blContract.address)
    ));

    await blContract.connect(signers[2])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[2])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await blContract.connect(signers[2])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );

    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1S2Balance - collateral1Amount, 4));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1BlBalance + collateral1Amount, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2S2Balance - collateral2Amount, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(blContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2BlBalance + collateral2Amount, 4));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(signers[2].address)
    ));
    expect(roundTo(result, 2)).to.equal(roundTo(collateral3S2Balance - collateral3Amount, 2));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(blContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral3BlBalance + collateral3Amount, 4));

    await blContract.connect(signers[2])
      .withdrawCollateral(
        1, ethers.utils.parseUnits(
          collateralWithdraw.toString()
        )
      );
    await blContract.connect(signers[2])
      .withdrawCollateral(
        2, ethers.utils.parseUnits(
          collateralWithdraw.toString()
        )
      );
    await blContract.connect(signers[2])
      .withdrawCollateral(
        3, ethers.utils.parseUnits(
          collateralWithdraw.toString()
        )
      );

    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1S2Balance - collateral1Amount + collateralWithdraw, 4));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1BlBalance + collateral1Amount - collateralWithdraw, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2S2Balance - collateral2Amount + collateralWithdraw, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(blContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2BlBalance + collateral2Amount - collateralWithdraw, 4));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(signers[2].address)
    ));
    expect(roundTo(result, 2)).to.equal(roundTo(collateral3S2Balance - collateral3Amount + collateralWithdraw, 2));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(blContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral3BlBalance + collateral3Amount - collateralWithdraw, 4));

    await blContract.connect(signers[2])
      .withdrawWholeCollateral(1);
    await blContract.connect(signers[2])
      .withdrawWholeCollateral(2);
    await blContract.connect(signers[2])
      .withdrawWholeCollateral(3);

    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1S2Balance, 4));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1BlBalance, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2S2Balance, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(blContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2BlBalance, 4));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(signers[2].address)
    ));
    expect(roundTo(result, 2)).to.equal(roundTo(collateral3S2Balance, 2));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(blContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral3BlBalance, 4));

    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString()), false);
    await blContract.connect(signers[1])
      .borrow(2, ethers.utils.parseUnits(borrowing2Amount.toString()), true);

    result = Number(ethers.utils.formatUnits(await signers[1].getBalance()));
    expect(roundTo(result, 1)).to.equal(roundTo(ethS1Balance - collateral3Amount, 1));
    result = Number(
      ethers.utils.formatUnits(await blContract.provider.getBalance(blContract.address))
    );
    expect(result).to.equal(collateral3Amount);
    result = Number(
      ethers.utils.formatUnits(await blContract.getAvailableCollateralAmount(signers[1].address, 1))
    );

    const collateralsExtraCapacity = collateral1BorrowingCapacity
      + collateral2BorrowingCapacity + collateral3BorrowingCapacity
      - borrowing1Amount - borrowing2Amount;
    const collateral1ExpectedAvailableAmount = Math.min(
      collateralsExtraCapacity, collateral1BorrowingCapacity
    ) / collateral1UsdRate / collateral1BorrowingFactor;
    const collateral2ExpectedAvailableAmount = Math.min(
      collateralsExtraCapacity, collateral2BorrowingCapacity
    ) / collateral2UsdRate / collateral2BorrowingFactor;
    const collateral3ExpectedAvailableAmount = Math.min(
      collateralsExtraCapacity, collateral3BorrowingCapacity
    ) / collateral3UsdRate / collateral3BorrowingFactor;
    expect(roundTo(result, 4)).to.equal(collateral1ExpectedAvailableAmount);
    result = Number(
      ethers.utils.formatUnits(await blContract.getAvailableCollateralAmount(signers[1].address, 2))
    );
    expect(roundTo(result, 4)).to.equal(collateral2ExpectedAvailableAmount);
    result = Number(
      ethers.utils.formatUnits(await blContract.getAvailableCollateralAmount(signers[1].address, 3))
    );
    expect(roundTo(result, 4)).to.equal(collateral3ExpectedAvailableAmount);
    result = Number(
      ethers.utils.formatUnits(await blContract.getAvailableBorrowingAmount(signers[1].address, 1))
    );
    expect(roundTo(result, 4)).to.equal(collateralsExtraCapacity);
    result = Number(
      ethers.utils.formatUnits(await blContract.getAvailableBorrowingAmount(signers[1].address, 2))
    );
    expect(roundTo(result, 4)).to.equal(collateralsExtraCapacity);
    const borrowing1Apr = Number(await blContract.getBorrowingApr(1)) / 10000;
    const borrowing2Apr = Number(await blContract.getBorrowingApr(2)) / 10000;

    await hre.timeAndMine.increaseTime('100 days');

    await blContract.connect(signers[10])
      .adminWithdraw(zeroAddress, ethers.utils.parseUnits('1'));
    result = Number(ethers.utils.formatUnits(
      await blContract.getAdminWithdraw(zeroAddress)
    ));
    expect(result).to.equal(1);
    result = Number(
      ethers.utils.formatUnits(await blContract.provider.getBalance(blContract.address))
    );
    expect(result).to.equal(collateral3Amount - 1);

    let borrowing1EffectiveApr = borrowing1Apr * (
      collateral1Amount * collateral1UsdRate
        + collateral3Amount * collateral3UsdRate
    ) / (
      collateral1Amount * collateral1UsdRate
        + collateral2Amount  * collateral2UsdRate
        + collateral3Amount * collateral3UsdRate
    );
    let borrowing2EffectiveApr = borrowing2Apr * (
      collateral1Amount * collateral1UsdRate
      + collateral3Amount * collateral3UsdRate
    ) / (
      collateral1Amount * collateral1UsdRate
      + collateral2Amount  * collateral2UsdRate
      + collateral3Amount * collateral3UsdRate
    );
    let borrowing1ExpectedFee = borrowing1Amount * borrowing1EffectiveApr * 100 / 365;
    let borrowing2ExpectedFee = borrowing2Amount * borrowing2EffectiveApr * 100 / 365;

    result = Number(
      ethers.utils.formatUnits(await blContract.getAvailableBorrowingAmount(signers[1].address, 1))
    );
    expect(roundTo(result, 4)).to
      .equal(roundTo(collateralsExtraCapacity - borrowing1ExpectedFee, 4));

    result = Number(
      ethers.utils.formatUnits(await blContract.getAvailableBorrowingAmount(signers[1].address, 2))
    );
    expect(roundTo(result, 4)).to
      .equal(roundTo(collateralsExtraCapacity - borrowing2ExpectedFee, 4));
    result = await blContract.getTotalUsers();
    expect(result).to.equal(3);
  });

  it("Liquidation", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 500;
    const borrowing2Amount = 500;
    const collateral1Amount = 5000;
    const collateral2Amount = 5000;
    const collateral3Amount = 1000;

    result = await blContract.getCollateralProfile(1);
    const collateral1UsdRate = Number(result.usdRate) / 10000;
    const collateral1BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateral1LiquidationFactor = Number(result.liquidationFactor) / 10000;
    const collateral1BorrowingCapacity = collateral1Amount * collateral1UsdRate
      * collateral1BorrowingFactor;
    result = await blContract.getCollateralProfile(2);
    const collateral2UsdRate = Number(result.usdRate) / 10000;
    const collateral2BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateral2LiquidationFactor = Number(result.liquidationFactor) / 10000;
    const collateral2BorrowingCapacity = collateral2Amount * collateral2UsdRate
      * collateral2BorrowingFactor;
    result = await blContract.getCollateralProfile(3);
    const collateral3UsdRate = Number(result.usdRate) / 10000;
    const collateral3BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateral3BorrowingCapacity = collateral3Amount * collateral3UsdRate
      * collateral3BorrowingFactor;

    await blContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);

    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString()));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await blContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString()), false);

    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.false;

    const collateral1MarginRate = borrowing1Amount * 10000
      * (1 + collateral1LiquidationFactor) / collateral1Amount;
    const collateral1PreMarginRate = collateral1MarginRate * 1.1;
    const marginBorrowing1Amount = collateral1PreMarginRate * collateral1Amount
     / (10000 * (1 + collateral1LiquidationFactor));
    const borrowing1Apr = Number(await blContract.getBorrowingApr(1));
    const preMarginPeriodInDays = Math.floor(
      (marginBorrowing1Amount - borrowing1Amount) * 365 * 10000
      / (borrowing1Apr * borrowing1Amount)
    );

    await blContract.connect(signers[9]).setCollateralProfileRate(1, collateral1MarginRate + 1);
    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.false;
    await blContract.connect(signers[9]).setCollateralProfileRate(1, collateral1MarginRate);
    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.true;

    await blContract.connect(signers[9]).setCollateralProfileRate(1, collateral1PreMarginRate);

    await hre.timeAndMine.increaseTime(`${preMarginPeriodInDays} days`);

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });
    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.false;

    await expect(
      blContract.connect(signers[10]).addFlagForLiquidation(signers[1].address)
    ).to.be.revertedWith('77');

    await expect(
      blContract.connect(signers[7]).addFlagForLiquidation(signers[1].address)
    ).to.be.revertedWith('53');

    await hre.timeAndMine.increaseTime(`1 days`);

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.true;

    await expect(
      blContract.connect(signers[7]).addFlagForLiquidation(signers[0].address)
    ).to.be.revertedWith('53');

    await blContract.connect(signers[7]).addFlagForLiquidation(signers[1].address);

    result = await blContract.isLiquidator(signers[8].address);
    expect(result).to.be.false;
    await blContract.connect(signers[10]).addToLiquidators(signers[8].address);
    result = await blContract.isLiquidator(signers[8].address);
    expect(result).to.be.true;

    result = await blContract.getUsersCollateralIndex(signers[1].address, 1);
    expect(Number(result)).to.equal(1);
    result = await blContract.getUsersBorrowingIndex(signers[1].address, 1);
    expect(Number(result)).to.equal(1);

    await expect(
      blContract.connect(signers[7]).liquidate(signers[1].address)
    ).to.be.revertedWith('78');
    await expect(
      blContract.connect(signers[8]).liquidate(signers[1].address)
    ).to.be.revertedWith('58');

    const collateral1LiquidatorBalance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[8].address)
    ));
    const collateral1LiquidationManagerBalance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[7].address)
    ));
    const collateral1BlBalance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    const liquidationFee = Number(ethers.utils.formatUnits(
      await blContract.getLiquidationFee(), 4
    ));
    const liquidatorPercentage = Number(ethers.utils.formatUnits(
      await blContract.getLiquidatorPercentage(), 4
    ));

    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });
    const borrowingFeeAfterLiquidation = Number(ethers.utils.formatUnits(
      await blContract.getBorrowingFee(1, true)
    ));

    await blContract.connect(signers[8]).liquidate(signers[1].address);

    result = await blContract.getBorrowingProfile(1);
    expect(roundTo(Number(ethers.utils.formatUnits(
      result.totalLiquidated
    )), 4)).to.equal(roundTo(borrowing1Amount + borrowingFeeAfterLiquidation, 4));

    result = await blContract.getCollateral(1);
    expect(result.liquidated).to.be.true;
    const collateral1AfterLiquidationAmount = Number(ethers.utils.formatUnits(result.amount));
    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.true;
    const borrowing1AfterLiquidationAmount = Number(ethers.utils.formatUnits(result.amount))
      + borrowingFeeAfterLiquidation;

    result = await blContract.getCollateral(2);
    expect(result.liquidated).to.be.false;
    const collateral1Remains = Number(ethers.utils.formatUnits(result.amount));
    const collateral2AfterLiquidationAmount = Number(ethers.utils.formatUnits(result.amount));
    const expectedCollateralTaken = borrowing1AfterLiquidationAmount * (1 + liquidationFee)
      / collateral1PreMarginRate * 10000;
    expect(roundTo(expectedCollateralTaken, 3)).to.equal(roundTo(
      collateral1AfterLiquidationAmount - collateral2AfterLiquidationAmount, 3
    ));
    const expectedCollateralSentToLiquidator = expectedCollateralTaken * liquidatorPercentage;
    const expectedCollateralSentToLiquidationManager = expectedCollateralTaken - expectedCollateralSentToLiquidator;

    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[7].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(
      collateral1LiquidationManagerBalance + expectedCollateralSentToLiquidationManager, 4
    ));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[8].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(
      collateral1LiquidatorBalance + expectedCollateralSentToLiquidator, 4
    ));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    expect(roundTo(result, 3)).to.equal(roundTo(
      collateral1BlBalance - expectedCollateralTaken, 3
    ));

    result = await blContract.getUsersCollateralIndex(signers[1].address, 1);
    expect(Number(result)).to.equal(2);
    result = await blContract.getUsersBorrowingIndex(signers[1].address, 1);
    expect(Number(result)).to.equal(0);

    await expect(
      blContract.connect(signers[8]).liquidate(signers[1].address)
    ).to.be.revertedWith('57');

    result = await blContract.getAvailableCollateralAmount(signers[1].address, 1);
    expect(roundTo(
      Number(ethers.utils.formatUnits(result)), 4
    )).to.be.equal(roundTo(collateral1Remains, 4));
    result = Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingAmount(signers[1].address, 1)
    ));
    const borrowing1AfterLiquidation = Math.floor(result);
    const borrowing1AfterLiquidationRemains = result - borrowing1AfterLiquidation;
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1AfterLiquidation.toString()), false);

    result = Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingAmount(signers[1].address, 1)
    ));
    expect(roundTo(result, 4)).to.be.equal(roundTo(borrowing1AfterLiquidationRemains, 4));
  });

  it("Flag removing (return borrowing)", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 500;
    const collateral1Amount = 5000;

    await blContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString()));

    await blContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString()), false);

    await hre.timeAndMine.increaseTime('100 days');

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const borrowedUsdAmount1 = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address), 22
    ));
    result = await blContract.getCollateralProfile(1);
    const collateral1UsdRate = Number(result.usdRate) / 10000;
    const collateral1LiquidationFactor = Number(result.liquidationFactor) / 10000;
    const liquidationFlagMargin = Number(ethers.utils.formatUnits(
      await blContract.getLiquidationFlagMargin(), 4
    ));
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(1), 22
    ));
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateral1LiquidationFactor);
    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount1;

    await blContract.connect(signers[9]).setBorrowingProfileRate(
      1, Math.ceil(marginBorrowingUsdRate * 10000).toString()
    );
    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.true;
    result = await blContract.liquidationTime(signers[1].address);
    expect(Number(result)).to.equal(0);

    const borrowedUsdAmount2 = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address), 22
    ));
    await blContract.connect(signers[7]).addFlagForLiquidation(signers[1].address);
    result = await blContract.liquidationTime(signers[1].address);
    expect(Number(result)).to.be.greaterThan(0);

    const borrowedUsdAmount3 = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address), 22
    ));
    const shouldBeCollateralUsdAmount = borrowedUsdAmount3 * (
      1 + collateral1LiquidationFactor + liquidationFlagMargin
    );
    const toBeAddedCollateralUsdAmount = shouldBeCollateralUsdAmount - collateral1UsdAmount;
    const toBeAddedCollateralAmount = toBeAddedCollateralUsdAmount / collateral1UsdRate;
    const shouldBeBorrowingUsdAmount = collateral1UsdAmount / (
      1 + collateral1LiquidationFactor + liquidationFlagMargin
    );
    const toBeReturnedBorrowingUsdAmount = borrowedUsdAmount3 - shouldBeBorrowingUsdAmount;
    const toBeReturnedBorrowingAmount = toBeReturnedBorrowingUsdAmount / marginBorrowingUsdRate;

    await blContract.connect(signers[1]).returnBorrowing(
      1, ethers.utils.parseUnits((toBeReturnedBorrowingAmount * 0.99).toString())
    );

    result = await blContract.liquidationTime(signers[1].address);
    expect(Number(result)).to.be.greaterThan(0);

    await blContract.connect(signers[1]).returnBorrowing(
      1, ethers.utils.parseUnits((toBeReturnedBorrowingAmount * 0.011).toString())
    );

    result = await blContract.liquidationTime(signers[1].address);
    expect(Number(result)).to.equal(0);
  });

  it("Flag removing (add collateral)", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 500;
    const collateral1Amount = 5000;

    await blContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString()));

    await blContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString()), false);

    await hre.timeAndMine.increaseTime('100 days');

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const borrowedUsdAmount1 = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address), 22
    ));
    result = await blContract.getCollateralProfile(1);
    const collateral1UsdRate = Number(result.usdRate) / 10000;
    const collateral1LiquidationFactor = Number(result.liquidationFactor) / 10000;
    const liquidationFlagMargin = Number(ethers.utils.formatUnits(
      await blContract.getLiquidationFlagMargin(), 4
    ));
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(1), 22
    ));
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateral1LiquidationFactor);
    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount1;

    await blContract.connect(signers[9]).setBorrowingProfileRate(
      1, Math.ceil(marginBorrowingUsdRate * 10000).toString()
    );
    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.true;
    result = await blContract.liquidationTime(signers[1].address);
    expect(Number(result)).to.equal(0);

    const borrowedUsdAmount2 = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address), 22
    ));
    await blContract.connect(signers[7]).addFlagForLiquidation(signers[1].address);
    result = await blContract.liquidationTime(signers[1].address);
    expect(Number(result)).to.be.greaterThan(0);

    const borrowedUsdAmount3 = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address), 22
    ));
    const shouldBeCollateralUsdAmount = borrowedUsdAmount3 * (
      1 + collateral1LiquidationFactor + liquidationFlagMargin
    );
    const toBeAddedCollateralUsdAmount = shouldBeCollateralUsdAmount - collateral1UsdAmount;
    const toBeAddedCollateralAmount = toBeAddedCollateralUsdAmount / collateral1UsdRate;
    const shouldBeBorrowingUsdAmount = collateral1UsdAmount / (
      1 + collateral1LiquidationFactor + liquidationFlagMargin
    );
    const toBeReturnedBorrowingUsdAmount = borrowedUsdAmount3 - shouldBeBorrowingUsdAmount;
    const toBeReturnedBorrowingAmount = toBeReturnedBorrowingUsdAmount / marginBorrowingUsdRate;

    await blContract.connect(signers[1]).depositCollateral(
      1, ethers.utils.parseUnits((toBeAddedCollateralAmount * 0.99).toString())
    );

    result = await blContract.liquidationTime(signers[1].address);
    expect(Number(result)).to.be.greaterThan(0);

    await blContract.connect(signers[1]).depositCollateral(
      1, ethers.utils.parseUnits((toBeAddedCollateralAmount * 0.011).toString())
    );

    result = await blContract.liquidationTime(signers[1].address);
    expect(Number(result)).to.equal(0);
  });

  it("Combined borrowing with liquidation, etna last", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 500;
    const borrowing2Amount = 500;
    const borrowing3Amount = 500;
    const collateral1Amount = 5000;
    const collateral2Amount = 5000;
    const collateral3Amount = 10;
    const collateral4Amount = 5000;

    await blContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await blContract.connect(signers[10])
      .addToLiquidators(signers[8].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString()));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await blContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await blContract.connect(signers[1])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );
    await blContract.connect(signers[2])
      .depositCollateral(1, ethers.utils.parseUnits(collateral4Amount.toString()));
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString()), false);
    await blContract.connect(signers[1])
      .borrow(2, ethers.utils.parseUnits(borrowing2Amount.toString()), true);
    await blContract.connect(signers[2])
      .borrow(1, ethers.utils.parseUnits(borrowing3Amount.toString()), false);

    await hre.timeAndMine.increaseTime('100 days');

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    result = await blContract.getCollateralProfile(1);
    const collateral1UsdRate = Number(result.usdRate) / 10000;
    const collateral1LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await blContract.getCollateralProfile(2);
    const collateral2UsdRate = Number(result.usdRate) / 10000;
    const collateral2LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await blContract.getCollateralProfile(3);
    const collateral3UsdRate = Number(result.usdRate) / 10000;
    const collateral3LiquidationFactor = Number(result.liquidationFactor) / 10000;

    const liquidationFee = Number(ethers.utils.formatUnits(
      await blContract.getLiquidationFee(), 4
    ));
    const liquidatorPercentage = Number(ethers.utils.formatUnits(
      await blContract.getLiquidatorPercentage(), 4
    ));

    const borrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(1)
    ));
    const collateral2UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(2)
    ));
    const collateral3UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(3)
    ));
    const depositedCollateralUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getDepositedCollateralUsdAmount(signers[1].address)
    ));
    expect(
      collateral1UsdAmount + collateral2UsdAmount + collateral3UsdAmount
    ).to.equal(depositedCollateralUsdAmount);
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateral1LiquidationFactor)
      + collateral2UsdAmount / (1 + collateral2LiquidationFactor)
      + collateral3UsdAmount / (1 + collateral3LiquidationFactor);

    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount * 10000;
    result = await blContract.userLiquidation(signers[2].address, false);
    expect(result).to.be.false;

    await blContract.connect(signers[9]).setBorrowingProfileRate(
      1, Math.floor(marginBorrowingUsdRate).toString()
    );
    await blContract.connect(signers[9]).setBorrowingProfileRate(
      2, Math.floor(marginBorrowingUsdRate).toString()
    );

    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.false;

    await blContract.connect(signers[9]).setBorrowingProfileRate(
      1, Math.ceil(marginBorrowingUsdRate).toString()
    );
    await blContract.connect(signers[9]).setBorrowingProfileRate(
      2, Math.ceil(marginBorrowingUsdRate).toString()
    );

    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.true;

    await blContract.connect(signers[7]).addFlagForLiquidation(signers[1].address);
    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const newBorrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    )) / 10000;
    const expectedWithdrawnCollateralUsdAmount = newBorrowedUsdAmount * (1 + liquidationFee);
    const expectedCollateralUsdRemains = (depositedCollateralUsdAmount / 10000 - expectedWithdrawnCollateralUsdAmount);
    const borrowing1Fee = Number(ethers.utils.formatUnits(
      await blContract.getBorrowingFee(1, true)
    ));

    await blContract.connect(signers[8]).liquidate(signers[1].address);
    result = await blContract.getBorrowingProfile(1);
    expect(roundTo(Number(ethers.utils.formatUnits(
      result.totalLiquidated
    )), 4)).to.equal(roundTo(
      borrowing1Amount + borrowing1Fee, 4
    ));

    result = await blContract.getCollateral(1);
    expect(result.liquidated).to.be.true;
    result = await blContract.getCollateral(2);
    expect(result.liquidated).to.be.true;
    result = await blContract.getCollateral(3);
    expect(result.liquidated).to.be.true;
    result = await blContract.getCollateral(5);
    expect(Number(result.prevCollateral)).to.equal(2);
    expect(result.liquidated).to.be.false;
    expect(roundTo(
      Number(ethers.utils.formatUnits(result.amount)), 3
    )).to.equal(roundTo(expectedCollateralUsdRemains / collateral2UsdRate, 3));
    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowing(2);
    expect(result.liquidated).to.be.true;

    result = await blContract.userLiquidation(signers[2].address, false);
    expect(result).to.be.true;
    await blContract.connect(signers[7]).addFlagForLiquidation(signers[2].address);

    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const newBorrowed4Amount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[2].address)
    )) / Math.ceil(marginBorrowingUsdRate);
    await blContract.connect(signers[8]).liquidate(signers[2].address);
    result = await blContract.getBorrowingProfile(1);
    const totalLiquidated = Number(ethers.utils.formatUnits(
      result.totalLiquidated
    ));
    expect(roundTo(totalLiquidated, 4)).to.equal(roundTo(
      borrowing1Amount + borrowing1Fee + newBorrowed4Amount, 4
    ));
    expect(Number(result.totalReturned)).to.equal(0);

    const returnedAmount = 100;
    await blContract.connect(signers[7]).returnLiquidatedBorrowing(
      1, ethers.utils.parseUnits(returnedAmount.toString())
    );
    result = await blContract.getBorrowingProfile(1);
    expect(roundTo(Number(ethers.utils.formatUnits(
      result.totalReturned
    )), 4)).to.equal(roundTo(returnedAmount, 4));
    expect(Number(ethers.utils.formatUnits(
      result.totalLiquidated
    ))).to.equal(totalLiquidated);
  });

  it("Combined borrowing with liquidation, erc20 last", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 500;
    const borrowing2Amount = 500;
    const collateral1Amount = 9900;
    const collateral2Amount = 100;
    const collateral3Amount = 10;

    await blContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await blContract.connect(signers[10])
      .addToLiquidators(signers[8].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString()));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await blContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await blContract.connect(signers[1])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString()), false);
    await blContract.connect(signers[1])
      .borrow(2, ethers.utils.parseUnits(borrowing2Amount.toString()), true);

    await hre.timeAndMine.increaseTime('100 days');

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    result = await blContract.getCollateralProfile(1);
    const collateral1UsdRate = Number(result.usdRate) / 10000;
    const collateral1LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await blContract.getCollateralProfile(2);
    const collateral2UsdRate = Number(result.usdRate) / 10000;
    const collateral2LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await blContract.getCollateralProfile(3);
    const collateral3UsdRate = Number(result.usdRate) / 10000;
    const collateral3LiquidationFactor = Number(result.liquidationFactor) / 10000;

    const liquidationFee = Number(ethers.utils.formatUnits(
      await blContract.getLiquidationFee(), 4
    ));
    const liquidatorPercentage = Number(ethers.utils.formatUnits(
      await blContract.getLiquidatorPercentage(), 4
    ));

    const borrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(1)
    ));
    const collateral2UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(2)
    ));
    const collateral3UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(3)
    ));
    const depositedCollateralUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getDepositedCollateralUsdAmount(signers[1].address)
    ));
    expect(
      collateral1UsdAmount + collateral2UsdAmount + collateral3UsdAmount
    ).to.equal(depositedCollateralUsdAmount);
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateral1LiquidationFactor)
      + collateral2UsdAmount / (1 + collateral2LiquidationFactor)
      + collateral3UsdAmount / (1 + collateral3LiquidationFactor);

    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount * 10000;

    await blContract.connect(signers[9]).setBorrowingProfileRate(
      1, Math.floor(marginBorrowingUsdRate).toString()
    );
    await blContract.connect(signers[9]).setBorrowingProfileRate(
      2, Math.floor(marginBorrowingUsdRate).toString()
    );

    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.false;

    await blContract.connect(signers[9]).setBorrowingProfileRate(
      1, Math.ceil(marginBorrowingUsdRate).toString()
    );
    await blContract.connect(signers[9]).setBorrowingProfileRate(
      2, Math.ceil(marginBorrowingUsdRate).toString()
    );

    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.true;

    await blContract.connect(signers[7]).addFlagForLiquidation(signers[1].address);
    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const newBorrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    )) / 10000;
    const expectedWithdrawnCollateralUsdAmount = newBorrowedUsdAmount * (1 + liquidationFee);
    const expectedCollateralUsdRemains = (depositedCollateralUsdAmount / 10000 - expectedWithdrawnCollateralUsdAmount);

    await blContract.connect(signers[8]).liquidate(signers[1].address);

    result = await blContract.getCollateral(1);
    expect(result.liquidated).to.be.true;

    result = await blContract.getCollateral(2);
    expect(result.liquidated).to.be.false;
    result = await blContract.getCollateral(3);
    expect(result.liquidated).to.be.true;

    result = await blContract.getCollateral(4);
    expect(Number(result.prevCollateral)).to.equal(1);
    expect(result.liquidated).to.be.false;

    expect(roundTo(
      Number(ethers.utils.formatUnits(result.amount)), 3
    )).to.equal(roundTo(
      (expectedCollateralUsdRemains - collateral2UsdAmount / 10000) / collateral1UsdRate, 3)
    );
    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowing(2);
    expect(result.liquidated).to.be.true;
  });

  it("Combined borrowing with liquidation, native last", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 500;
    const borrowing2Amount = 500;
    const collateral1Amount = 5000;
    const collateral2Amount = 5000;
    const collateral3Amount = 1000;

    await blContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await blContract.connect(signers[10])
      .addToLiquidators(signers[8].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString()));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await blContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await blContract.connect(signers[1])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString()), false);
    await blContract.connect(signers[1])
      .borrow(2, ethers.utils.parseUnits(borrowing2Amount.toString()), true);

    await hre.timeAndMine.increaseTime('100 days');

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    result = await blContract.getCollateralProfile(1);
    const collateral1UsdRate = Number(result.usdRate) / 10000;
    const collateral1LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await blContract.getCollateralProfile(2);
    const collateral2UsdRate = Number(result.usdRate) / 10000;
    const collateral2LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await blContract.getCollateralProfile(3);
    const collateral3UsdRate = Number(result.usdRate) / 10000;
    const collateral3LiquidationFactor = Number(result.liquidationFactor) / 10000;

    const liquidationFee = Number(ethers.utils.formatUnits(
      await blContract.getLiquidationFee(), 4
    ));
    const liquidatorPercentage = Number(ethers.utils.formatUnits(
      await blContract.getLiquidatorPercentage(), 4
    ));

    const borrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(1)
    ));
    const collateral2UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(2)
    ));
    const collateral3UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(3)
    ));
    const depositedCollateralUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getDepositedCollateralUsdAmount(signers[1].address)
    ));
    expect(
      collateral1UsdAmount + collateral2UsdAmount + collateral3UsdAmount
    ).to.equal(depositedCollateralUsdAmount);
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateral1LiquidationFactor)
      + collateral2UsdAmount / (1 + collateral2LiquidationFactor)
      + collateral3UsdAmount / (1 + collateral3LiquidationFactor);

    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount * 10000;

    await blContract.connect(signers[9]).setBorrowingProfileRate(
      1, Math.floor(marginBorrowingUsdRate).toString()
    );
    await blContract.connect(signers[9]).setBorrowingProfileRate(
      2, Math.floor(marginBorrowingUsdRate).toString()
    );

    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.false;

    await blContract.connect(signers[9]).setBorrowingProfileRate(
      1, Math.ceil(marginBorrowingUsdRate).toString()
    );
    await blContract.connect(signers[9]).setBorrowingProfileRate(
      2, Math.ceil(marginBorrowingUsdRate).toString()
    );

    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.true;

    const collateral1BlBalance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    const collateral1S8Balance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[8].address)
    ));
    const collateral1S7Balance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[7].address)
    ));

    await expect(
      blContract.connect(signers[8]).liquidate(signers[1].address)
    ).to.be.revertedWith('57');
    await blContract.connect(signers[7]).addFlagForLiquidation(signers[1].address);
    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const newBorrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    )) / 10000;
    const expectedWithdrawnCollateralUsdAmount = newBorrowedUsdAmount * (1 + liquidationFee);
    const expectedCollateralUsdRemains = (depositedCollateralUsdAmount / 10000 - expectedWithdrawnCollateralUsdAmount);

    await blContract.connect(signers[8]).liquidate(signers[1].address);

    result = await blContract.getCollateral(1);
    expect(result.liquidated).to.be.false;
    result = await blContract.getCollateral(2);
    expect(result.liquidated).to.be.false;
    result = await blContract.getCollateral(3);
    expect(result.liquidated).to.be.true;
    result = await blContract.getCollateral(4);
    expect(Number(result.prevCollateral)).to.equal(3);
    expect(result.liquidated).to.be.false;
    expect(roundTo(
      Number(ethers.utils.formatUnits(result.amount)), 3
    )).to.equal(roundTo(
      (
          expectedCollateralUsdRemains - collateral1UsdAmount / 10000 - collateral2UsdAmount / 10000
      ) / collateral3UsdRate, 3
    ));
    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowing(2);
    expect(result.liquidated).to.be.true;
  });

  it("NFT collateral", async function () {
    result = await blContract.getCollateral(1);
    expect(result.userAddress).to.equal(zeroAddress);

    result = await nftCollateralContract.getDepositsNumber();
    expect(Number(result)).to.equal(0);
    result = Number(await marketplaceContract.getProfileIdByTokenId(1));
    const nft1Price = Number(ethers.utils.formatUnits(
      await marketplaceContract.getSellPriceById(result)
    ));
    result = Number(await marketplaceContract.getProfileIdByTokenId(2));
    const nft2Price = Number(ethers.utils.formatUnits(
      await marketplaceContract.getSellPriceById(result)
    ));
    result = Number(await marketplaceContract.getProfileIdByTokenId(3));
    const nft3Price = Number(ethers.utils.formatUnits(
      await marketplaceContract.getSellPriceById(result)
    ));
    result = Number(await marketplaceContract.getProfileIdByTokenId(4));
    const nft4Price = Number(ethers.utils.formatUnits(
      await marketplaceContract.getSellPriceById(result)
    ));
    result = Number(await marketplaceContract.getProfileIdByTokenId(5));
    const nft5Price = Number(ethers.utils.formatUnits(
      await marketplaceContract.getSellPriceById(result)
    ));
    result = Number(await marketplaceContract.getProfileIdByTokenId(6));
    const nft6Price = Number(ethers.utils.formatUnits(
      await marketplaceContract.getSellPriceById(result)
    ));

    await nftCollateralContract.connect(signers[0])
      .depositNftCollateral([1,2,4]);
    result = await nftCollateralContract.getTokensNumber();
    expect(Number(result)).to.equal(2);

    result = await nftCollateralContract.getDepositsNumber();
    expect(Number(result)).to.equal(1);

    result = await nftCollateralContract.getDeposit(1);
    expect(result.userAddress).to.equal(signers[0].address);
    let amount = Number(ethers.utils.formatUnits(result.amount));
    expect(amount).to.equal(nft1Price + nft2Price);
    expect(Number(result.tokensNumber)).to.equal(2);

    result = await blContract.getCollateral(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.collateralProfileIndex)).to.equal(4);
    expect(Number(ethers.utils.formatUnits(
      result.amount
    ))).to.equal(nft1Price + nft2Price);
    expect(result.liquidated).to.be.false;

    result = await nftCollateralContract.getUserTokensNumber(signers[0].address);
    expect(Number(result)).to.equal(2);

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(nft1Price + nft2Price);

    let tokensPrice = 0;
    result = await nftCollateralContract.getLastTokenPrice(1);
    tokensPrice += Number(ethers.utils.formatUnits(result));
    result = await nftCollateralContract.getLastTokenPrice(2);
    tokensPrice += Number(ethers.utils.formatUnits(result));
    expect(amount).to.equal(tokensPrice);

    await nftCollateralContract.connect(signers[0])
      .depositNftCollateral([3]);
    result = await nftCollateralContract.getTokensNumber();
    expect(Number(result)).to.equal(3);

    result = await blContract.getCollateral(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.collateralProfileIndex)).to.equal(4);
    expect(Number(ethers.utils.formatUnits(
      result.amount
    ))).to.equal(nft1Price + nft2Price + nft3Price);
    expect(result.liquidated).to.be.false;

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(nft1Price + nft2Price + nft3Price);

    result = await nftCollateralContract.getDeposit(1);
    amount = Number(ethers.utils.formatUnits(result.amount));
    result = await nftCollateralContract.getLastTokenPrice(3);
    tokensPrice += Number(ethers.utils.formatUnits(result));
    expect(amount).to.equal(tokensPrice);

    result = await nftCollateralContract.getTokenStaker(1);
    expect(result).to.equal(signers[0].address);
    result = await nftCollateralContract.getTokenStaker(2);
    expect(result).to.equal(signers[0].address);
    result = await nftCollateralContract.getTokenStaker(3);
    expect(result).to.equal(signers[0].address);

    result = await nftCollateralContract.getUserTokensNumber(signers[0].address);
    expect(Number(result)).to.equal(3);

    result = await nftCollateralContract.getUserTokenByIndex(signers[0].address, 1);
    expect(Number(result)).to.equal(1);
    result = await nftCollateralContract.getUserTokenByIndex(signers[0].address, 2);
    expect(Number(result)).to.equal(2);
    result = await nftCollateralContract.getUserTokenByIndex(signers[0].address, 3);
    expect(Number(result)).to.equal(3);

    await nftCollateralContract.connect(signers[1])
      .depositNftCollateral([4,5,6]);

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(
      nft1Price + nft2Price + nft3Price + nft4Price + nft5Price + nft6Price
    );

    result = await nftCollateralContract.getTokensNumber();
    expect(Number(result)).to.equal(6);
    result = await nftCollateralContract.getDeposit(2);
    expect(Number(result.tokensNumber)).to.equal(3);

    result = await nftCollateralContract.getTokenStaker(4);
    expect(result).to.equal(signers[1].address);
    result = await nftCollateralContract.getTokenStaker(5);
    expect(result).to.equal(signers[1].address);
    result = await nftCollateralContract.getTokenStaker(6);
    expect(result).to.equal(signers[1].address);

    result = await nftCollateralContract.getUserTokenByIndex(signers[1].address, 1);
    expect(Number(result)).to.equal(4);
    result = await nftCollateralContract.getUserTokenByIndex(signers[1].address, 2);
    expect(Number(result)).to.equal(5);
    result = await nftCollateralContract.getUserTokenByIndex(signers[1].address, 3);
    expect(Number(result)).to.equal(6);

    await nftCollateralContract.connect(signers[2])
      .depositNftCollateral(tokensArray);

    result = await nftCollateralContract.getTokensNumber();
    expect(Number(result)).to.equal(6 + tokensArray.length);
    result = await nftCollateralContract.getUserDeposit(signers[2].address);
    expect(Number(result.depositIndex)).to.equal(3);
    expect(Number(result.tokensNumber)).to.equal(batchLimit);

    let tokensValue = 0;
    for (const id of tokensArray) {
      result = Number(await marketplaceContract.getProfileIdByTokenId(id));
      tokensValue += Number(ethers.utils.formatUnits(
        await marketplaceContract.getSellPriceById(result)
      ));
    }
    result = await blContract.getCollateral(3);
    expect(result.userAddress).to.equal(signers[2].address);
    expect(Number(result.collateralProfileIndex)).to.equal(4);
    expect(Number(ethers.utils.formatUnits(
      result.amount
    ))).to.equal(tokensValue);
    expect(result.liquidated).to.be.false;

    const nEtnaBalance = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(blContract.address)
    ));
    expect(nEtnaBalance).to.equal(
      tokensValue + nft1Price + nft2Price + nft3Price + nft4Price + nft5Price + nft6Price
    );

    await nftCollateralContract.connect(signers[0])
      .withdrawNftCollateral([1,2,4]);

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(
      nEtnaBalance - nft1Price - nft2Price
    );

    result = await blContract.getCollateral(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.collateralProfileIndex)).to.equal(4);
    expect(Number(ethers.utils.formatUnits(
      result.amount
    ))).to.equal(nft3Price);
    expect(result.liquidated).to.be.false;

    let toBorrowS1 = Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingAmount(signers[1].address, 1)
    ));

    await blContract.connect(signers[0]).lend(
      1, ethers.utils.parseUnits(toBorrowS1.toString())
    );

    toBorrowS1 /= 3;

    await blContract.connect(signers[1]).borrow(
      1, ethers.utils.parseUnits(toBorrowS1.toString()), false
    );

    await expect(
      nftCollateralContract.connect(signers[1])
      .withdrawNftCollateral([4,5,6])
    ).to.be.revertedWith('30');

    await nftCollateralContract.connect(signers[1])
      .withdrawNftCollateral([4]);

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(
      nEtnaBalance - nft1Price - nft2Price - nft4Price
    );

    await expect(
      nftCollateralContract.connect(signers[1])
      .withdrawNftCollateral([5,6])
    ).to.be.revertedWith('30');

    const lastToken = tokensArray.pop();

    result = Number(await marketplaceContract.getProfileIdByTokenId(lastToken));
    const lastTokenPrice = Number(ethers.utils.formatUnits(
      await marketplaceContract.getSellPriceById(result)
    ));
    tokensValue -= lastTokenPrice;

    await nftCollateralContract.connect(signers[2])
      .withdrawNftCollateral(tokensArray);

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(
      nEtnaBalance - nft1Price - nft2Price - nft4Price - tokensValue
    );
    expect(result).to.equal(
      nft3Price + nft5Price + nft6Price + lastTokenPrice
    );

    await blContract.connect(signers[1]).returnBorrowing(
      1, ethers.utils.parseUnits(toBorrowS1.toString())
    );
    await nftCollateralContract.connect(signers[1])
      .withdrawNftCollateral([5,6]);

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(
      nft3Price + lastTokenPrice
    );

    result = await blContract.getCollateral(3);
    expect(result.userAddress).to.equal(signers[2].address);
    expect(Number(result.collateralProfileIndex)).to.equal(4);
    expect(Number(ethers.utils.formatUnits(
      result.amount
    ))).to.equal(lastTokenPrice);
    expect(result.liquidated).to.be.false;
  });

  it("NFT collateral liquidation", async function () {
    await nftCollateralContract.connect(signers[0])
      .depositNftCollateral([1,2,3]);
    result = await nftCollateralContract.getTokensNumber();
    expect(Number(result)).to.equal(3);

    await nftCollateralContract.connect(signers[1])
      .depositNftCollateral([4,5,6]);
    result = await nftCollateralContract.getTokensNumber();
    expect(Number(result)).to.equal(6);

    await nftCollateralContract.connect(signers[2])
      .depositNftCollateral([7,8,9,10,11,12,13,14,15,16]);
    result = await nftCollateralContract.getTokensNumber();
    expect(Number(result)).to.equal(16);

    await blContract.connect(signers[3]).lend(
        1, ethers.utils.parseUnits(initialEtnaTransfer.toString())
      );

    await blContract.connect(signers[0])
      .borrowAvailable(1, false);
    await blContract.connect(signers[1])
      .borrowAvailable(1, false);
    await blContract.connect(signers[2])
      .borrowAvailable(1, false);

    await blContract.connect(signers[9])
      .setBorrowingProfileRate(1, 100000);

    result = await blContract.userLiquidation(signers[0].address, false);
    expect(result).to.be.true;
    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.true;
    result = await blContract.userLiquidation(signers[2].address, false);
    expect(result).to.be.true;

    await blContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await blContract.connect(signers[10])
      .addToLiquidators(signers[8].address);
    await blContract.connect(signers[7])
      .addFlagForLiquidation(signers[0].address);
    await blContract.connect(signers[7])
      .addFlagForLiquidation(signers[1].address);
    await blContract.connect(signers[7])
      .addFlagForLiquidation(signers[2].address);

    hre.timeAndMine.increaseTime('1 day');

    await blContract.connect(signers[8])
      .liquidate(signers[0].address);
    await blContract.connect(signers[8])
      .liquidate(signers[1].address);
    await blContract.connect(signers[8])
      .liquidate(signers[2].address);

    result = await nftCollateralContract.getAtLiquidationNumber();
    expect(Number(result)).to.equal(3);
    result = await nftCollateralContract.isAtLiquidation(signers[0].address);
    expect(result).to.be.true;
    result = await nftCollateralContract.isAtLiquidation(signers[1].address);
    expect(result).to.be.true;
    result = await nftCollateralContract.isAtLiquidation(signers[2].address);
    expect(result).to.be.true;
    result = await nftCollateralContract.getUserTokensNumber(signers[2].address);
    expect(Number(result)).to.equal(10);

    await nftCollateralContract.connect(signers[7])
      .withdrawLiquidatedCollateral(signers[2].address, [7,8,9,10,11,12,13,14,15]);
    result = await nftCollateralContract.getUserTokensNumber(signers[2].address);
    expect(Number(result)).to.equal(1);
    result = await nftCollateralContract.getAtLiquidationNumber();
    expect(Number(result)).to.equal(3);
    result = await nftCollateralContract.isAtLiquidation(signers[2].address);
    expect(result).to.be.true;

    await nftCollateralContract.connect(signers[7])
      .withdrawLiquidatedCollateral(signers[2].address, [16]);

    result = await nftCollateralContract.getUserTokensNumber(signers[2].address);
    expect(Number(result)).to.equal(0);
    result = await nftCollateralContract.getAtLiquidationNumber();
    expect(Number(result)).to.equal(2);
    result = await nftCollateralContract.isAtLiquidation(signers[0].address);
    expect(result).to.be.true;
    result = await nftCollateralContract.isAtLiquidation(signers[1].address);
    expect(result).to.be.true;
    result = await nftCollateralContract.isAtLiquidation(signers[2].address);
    expect(result).to.be.false;

    await nftCollateralContract.connect(signers[7])
      .withdrawLiquidatedCollateral(signers[1].address, [4,5,6]);

    result = await nftCollateralContract.getAtLiquidationNumber();
    expect(Number(result)).to.equal(1);
    result = await nftCollateralContract.isAtLiquidation(signers[0].address);
    expect(result).to.be.true;
    result = await nftCollateralContract.isAtLiquidation(signers[1].address);
    expect(result).to.be.false;
    result = await nftCollateralContract.isAtLiquidation(signers[2].address);
    expect(result).to.be.false;

    await nftCollateralContract.connect(signers[7])
      .withdrawLiquidatedCollateral(signers[0].address, [1,2,3]);

    result = await nftContract.ownerOf(1);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(2);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(3);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(4);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(5);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(6);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(7);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(8);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(9);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(10);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(11);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(12);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(13);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(14);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(15);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(16);
    expect(result).to.equal(signers[7].address);

    result = await nftCollateralContract.getAtLiquidationNumber();
    expect(Number(result)).to.equal(0);
    result = await nftCollateralContract.isAtLiquidation(signers[0].address);
    expect(result).to.be.false;
    result = await nftCollateralContract.isAtLiquidation(signers[1].address);
    expect(result).to.be.false;
    result = await nftCollateralContract.isAtLiquidation(signers[2].address);
    expect(result).to.be.false;
  });

  it("Combined borrowing with liquidation, netna last", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 5;
    let borrowing2Amount;
    const collateral1Amount = 25;
    const collateral2Amount = 25;
    const collateral3Amount = 0.01;

    await blContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await blContract.connect(signers[10])
      .addToLiquidators(signers[8].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString()));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await blContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await blContract.connect(signers[1])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );

    await nftCollateralContract.connect(signers[1])
      .depositNftCollateral([4,5,6]);
    await nftCollateralContract.connect(signers[0])
      .depositNftCollateral([1,2,3]);

    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString()), false);

    await blContract.connect(signers[1])
      .borrowAvailable(2, true);

    await hre.timeAndMine.increaseTime('100 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    result = await blContract.getCollateralProfile(1);
    const collateral1UsdRate = Number(result.usdRate) / 10000;
    const collateral1LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await blContract.getCollateralProfile(2);
    const collateral2UsdRate = Number(result.usdRate) / 10000;
    const collateral2LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await blContract.getCollateralProfile(3);
    const collateral3UsdRate = Number(result.usdRate) / 10000;
    const collateral3LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await blContract.getCollateralProfile(4);
    const collateral4UsdRate = Number(result.usdRate) / 10000;
    const collateral4LiquidationFactor = Number(result.liquidationFactor) / 10000;

    const liquidationFee = Number(ethers.utils.formatUnits(
      await blContract.getLiquidationFee(), 4
    ));
    const liquidatorPercentage = Number(ethers.utils.formatUnits(
      await blContract.getLiquidatorPercentage(), 4
    ));

    const borrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(1)
    ));
    const collateral2UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(2)
    ));
    const collateral3UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(3)
    ));
    const collateral4UsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getCollateralUsdAmount(4)
    ));

    const depositedCollateralUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getDepositedCollateralUsdAmount(signers[1].address)
    ));
    expect(
      collateral1UsdAmount + collateral2UsdAmount + collateral3UsdAmount + collateral4UsdAmount
    ).to.equal(depositedCollateralUsdAmount);
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateral1LiquidationFactor)
      + collateral2UsdAmount / (1 + collateral2LiquidationFactor)
      + collateral3UsdAmount / (1 + collateral3LiquidationFactor)
      + collateral4UsdAmount / (1 + collateral4LiquidationFactor);

    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount * 10000;

    await blContract.connect(signers[9]).setBorrowingProfileRate(
      1, Math.floor(marginBorrowingUsdRate).toString()
    );
    await blContract.connect(signers[9]).setBorrowingProfileRate(
      2, Math.floor(marginBorrowingUsdRate).toString()
    );

    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.false;

    await blContract.connect(signers[9]).setBorrowingProfileRate(
      1, Math.ceil(marginBorrowingUsdRate).toString()
    );
    await blContract.connect(signers[9]).setBorrowingProfileRate(
      2, Math.ceil(marginBorrowingUsdRate).toString()
    );

    result = await blContract.userLiquidation(signers[1].address, false);
    expect(result).to.be.true;

    await blContract.connect(signers[7]).addFlagForLiquidation(signers[1].address);
    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const newBorrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    )) / 10000;
    const expectedWithdrawnCollateralUsdAmount = newBorrowedUsdAmount * (1 + liquidationFee);
    const expectedCollateralUsdRemains = (depositedCollateralUsdAmount / 10000 - expectedWithdrawnCollateralUsdAmount);
    const borrowing1Fee = Number(ethers.utils.formatUnits(
      await blContract.getBorrowingFee(1, true)
    ));

    const collateral1S7BalanceBefore = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[7].address)
    ));
    const collateral1S8BalanceBefore = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[8].address)
    ));
    const collateral1BlBalanceBefore = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    const collateral2S7BalanceBefore = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[7].address)
    ));
    const collateral2S8BalanceBefore = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[8].address)
    ));
    const collateral2BlBalanceBefore = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(blContract.address)
    ));
    const collateral3S7BalanceBefore = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(signers[7].address)
    ));
    const collateral3S8BalanceBefore = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(signers[8].address)
    ));
    const collateral3BlBalanceBefore = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(blContract.address)
    ));
    const collateral4S7BalanceBefore = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(signers[7].address)
    ));
    const collateral4S8BalanceBefore = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(signers[8].address)
    ));
    const collateral4BlBalanceBefore = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(blContract.address)
    ));

    await blContract.connect(signers[8]).liquidate(signers[1].address);
    result = await blContract.getBorrowingProfile(1);
    expect(roundTo(Number(ethers.utils.formatUnits(
      result.totalLiquidated
    )), 4)).to.equal(roundTo(
      borrowing1Amount + borrowing1Fee, 4
    ));

    const collateral1S7BalanceAfter = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[7].address)
    ));
    const collateral1S8BalanceAfter = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[8].address)
    ));
    const collateral1BlBalanceAfter = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    const collateral2S7BalanceAfter = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[7].address)
    ));
    const collateral2S8BalanceAfter = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[8].address)
    ));
    const collateral2BlBalanceAfter = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(blContract.address)
    ));
    const collateral3S7BalanceAfter = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(signers[7].address)
    ));
    const collateral3S8BalanceAfter = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(signers[8].address)
    ));
    const collateral3BlBalanceAfter = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(blContract.address)
    ));
    const collateral4S7BalanceAfter = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(signers[7].address)
    ));
    const collateral4S8BalanceAfter = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(signers[8].address)
    ));
    const collateral4BlBalanceAfter = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(blContract.address)
    ));

    result = await blContract.getCollateral(1);
    expect(result.liquidated).to.be.true;
    const collateral1LiquidatedAmount = Number(ethers.utils.formatUnits(result.amount));
    result = await blContract.getCollateral(2);
    expect(result.liquidated).to.be.true;
    const collateral2LiquidatedAmount = Number(ethers.utils.formatUnits(result.amount));
    result = await blContract.getCollateral(3);
    expect(result.liquidated).to.be.true;
    const collateral3LiquidatedAmount = Number(ethers.utils.formatUnits(result.amount));
    result = await blContract.getCollateral(4);
    expect(result.liquidated).to.be.true;
    let collateral4LiquidatedAmount = Number(ethers.utils.formatUnits(result.amount));
    result = await blContract.getCollateral(5);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(result.liquidated).to.be.false;
    result = await blContract.getCollateral(6);
    expect(result.userAddress).to.equal(zeroAddress);

    expect(roundTo(collateral1S7BalanceAfter, 8)).to.equal(roundTo(
      collateral1S7BalanceBefore + collateral1LiquidatedAmount * (1 - liquidatorPercentage), 8
    ));
    expect(roundTo(collateral1S8BalanceAfter, 8)).to.equal(roundTo(
      collateral1S8BalanceBefore + collateral1LiquidatedAmount * liquidatorPercentage, 8
    ));
    expect(roundTo(collateral1BlBalanceAfter, 8)).to.equal(roundTo(
      collateral1BlBalanceBefore - collateral1LiquidatedAmount, 8
    ));
    expect(roundTo(collateral2S7BalanceAfter, 8)).to.equal(roundTo(
      collateral2S7BalanceBefore + collateral2LiquidatedAmount * (1 - liquidatorPercentage), 8
    ));
    expect(roundTo(collateral2S8BalanceAfter, 8)).to.equal(roundTo(
      collateral2S8BalanceBefore + collateral2LiquidatedAmount * liquidatorPercentage, 8
    ));
    expect(roundTo(collateral2BlBalanceAfter, 8)).to.equal(roundTo(
      collateral2BlBalanceBefore - collateral2LiquidatedAmount, 8
    ));
    expect(roundTo(collateral3S7BalanceAfter, 8)).to.equal(roundTo(
      collateral3S7BalanceBefore + collateral3LiquidatedAmount * (1 - liquidatorPercentage), 8
    ));
    expect(roundTo(collateral3S8BalanceAfter, 2)).to.equal(roundTo(
      collateral3S8BalanceBefore + collateral3LiquidatedAmount * liquidatorPercentage, 2
    ));
    expect(roundTo(collateral3BlBalanceAfter, 8)).to.equal(roundTo(
      collateral3BlBalanceBefore - collateral3LiquidatedAmount, 8
    ));
    expect(roundTo(collateral4S7BalanceAfter, 8)).to.equal(roundTo(
      collateral4S7BalanceBefore, 8
    ));
    expect(roundTo(collateral4S8BalanceAfter, 8)).to.equal(roundTo(
      collateral4S8BalanceBefore, 8
    ));
    expect(roundTo(collateral4BlBalanceAfter, 8)).to.equal(roundTo(
      collateral4BlBalanceBefore - collateral4LiquidatedAmount, 8
    ));

    result = await nftCollateralContract.isAtLiquidation(
      signers[1].address
    );
    expect(result).to.be.true;
    result = await nftCollateralContract.getUserTokensNumber(
      signers[1].address
    );
    expect(result).to.equal(3);
    result = await nftCollateralContract.getUserTokenByIndex(
      signers[1].address, 1
    );
    expect(result).to.equal(4);
    result = await nftCollateralContract.getUserTokenByIndex(
      signers[1].address, 2
    );
    expect(result).to.equal(5);
    result = await nftCollateralContract.getUserTokenByIndex(
      signers[1].address, 3
    );
    expect(result).to.equal(6);
    result = await nftCollateralContract.getUserTokenByIndex(
      signers[1].address, 4
    );
    expect(result).to.equal(0);

    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowing(2);
    expect(result.liquidated).to.be.true;
    await expect(
      nftCollateralContract.connect(signers[1])
      .withdrawNftCollateral([4])
    ).to.be.revertedWith('Sender is at liquidation');
    await expect(
      nftCollateralContract.connect(signers[1])
      .withdrawNftCollateral([4,5,6])
    ).to.be.revertedWith('Sender is at liquidation');
    await expect(
      nftCollateralContract.connect(signers[0])
        .withdrawLiquidatedCollateral(signers[1].address, [4,5,7])
    ).to.be.revertedWith('Caller is not the liquidation manager');
    await expect(
      nftCollateralContract.connect(signers[7])
      .withdrawLiquidatedCollateral(signers[0].address, [4,5,7])
    ).to.be.revertedWith('User is not at liquidation');

    await nftCollateralContract.connect(signers[7])
      .withdrawLiquidatedCollateral(signers[1].address, [4,5,3]);

    result = await nftCollateralContract.isAtLiquidation(
      signers[1].address
    );
    expect(result).to.be.true;
    result = await nftCollateralContract.getUserTokensNumber(
      signers[1].address
    );
    expect(result).to.equal(1);
    result = await nftCollateralContract.getUserTokenByIndex(
      signers[1].address, 1
    );
    expect(result).to.equal(6);
    result = await nftCollateralContract.getUserTokenByIndex(
      signers[1].address, 2
    );
    expect(result).to.equal(0);

    result = await nftContract.ownerOf(4);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(5);
    expect(result).to.equal(signers[7].address);
    result = await nftContract.ownerOf(6);
    expect(result).to.equal(nftCollateralContract.address);
    result = await nftContract.ownerOf(3);
    expect(result).to.equal(nftCollateralContract.address);

    await nftCollateralContract.connect(signers[7])
      .withdrawLiquidatedCollateral(signers[1].address, [6]);
    result = await nftContract.ownerOf(6);
    expect(result).to.equal(signers[7].address);

    result = await nftCollateralContract.isAtLiquidation(
      signers[1].address
    );
    expect(result).to.be.false;
    result = await nftCollateralContract.getUserTokensNumber(
      signers[1].address
    );
    expect(result).to.equal(0);
    result = await nftCollateralContract.getUserTokenByIndex(
      signers[1].address, 1
    );
    expect(result).to.equal(0);

    await expect(
      nftCollateralContract.connect(signers[7])
      .withdrawLiquidatedCollateral(signers[0].address, [6])
    ).to.be.revertedWith('User is not at liquidation');
  });

  it("Admin settings", async function () {
    result = await blContract.isManager(signers[3].address);
    expect(result).to.be.false;
    await expect(
      blContract.connect(signers[0]).addToManagers(signers[3].address)
    )
      .to.be.revertedWith('62');
    await expect(
      blContract.connect(signers[3]).removeFromManagers(signers[4].address)
    )
      .to.be.revertedWith('62');
    await blContract.connect(signers[10]).addToManagers(signers[3].address);
    result = await blContract.isManager(signers[3].address);
    expect(result).to.be.true;
    await expect(
      blContract.connect(signers[3]).addToManagers(signers[0].address)
    )
      .to.be.revertedWith('62');
    await blContract.connect(signers[10]).removeFromManagers(signers[3].address);
    result = await blContract.isManager(signers[3].address);
    expect(result).to.be.false;

    result = await blContract.isLiquidator(signers[3].address);
    expect(result).to.be.false;
    await blContract.connect(signers[10]).addToLiquidators(signers[3].address);
    result = await blContract.isLiquidator(signers[3].address);
    expect(result).to.be.true;
    await expect(
      blContract.connect(signers[0]).addToLiquidators(signers[3].address)
    )
      .to.be.revertedWith('62');
    await expect(
      blContract.connect(signers[3]).removeFromLiquidators(signers[4].address)
    )
      .to.be.revertedWith('62');
    await blContract.connect(signers[10]).removeFromLiquidators(signers[3].address);
    result = await blContract.isLiquidator(signers[3].address);
    expect(result).to.be.false;

    result = await blContract.getLiquidationManager();
    expect(result).to.equal(signers[10].address);
    await expect(
      blContract.connect(signers[3]).setLiquidationManager(signers[9].address)
    )
      .to.be.revertedWith('62');
    await blContract.connect(signers[10]).setLiquidationManager(signers[9].address);
    result = await blContract.getLiquidationManager();
    expect(result).to.equal(signers[9].address);
    await expect(
      blContract.connect(signers[10]).setLiquidationManager(zeroAddress)
    )
      .to.be.revertedWith('76');

    result = await blContract.owner();
    expect(result).to.equal(signers[10].address);
    await blContract.connect(signers[10])
      .transferOwnership(signers[0].address);
    result = await blContract.owner();
    expect(result).to.equal(signers[0].address);
    await blContract.connect(signers[0])
      .transferOwnership(signers[10].address);
    result = await blContract.owner();
    expect(result).to.equal(signers[10].address);

    result = await nftCollateralContract.owner();
    expect(result).to.equal(signers[10].address);
    await nftCollateralContract.connect(signers[10])
      .transferOwnership(signers[0].address);
    result = await nftCollateralContract.owner();
    expect(result).to.equal(signers[0].address);
    await nftCollateralContract.connect(signers[0])
      .transferOwnership(signers[10].address);
    result = await nftCollateralContract.owner();
    expect(result).to.equal(signers[10].address);

    await nftCollateralContract.connect(signers[10])
      .setBatchLimit(3);
    result = await nftCollateralContract.getBatchLimit();
    expect(Number(result)).to.equal(3);

    await nftCollateralContract.connect(signers[10])
      .setNEtnaContract(signers[0].address);
    result = await nftCollateralContract.getNEtnaContract();
    expect(result).to.equal(signers[0].address);

    await nftCollateralContract.connect(signers[10])
      .setMarketplaceContract(signers[0].address);
    result = await nftCollateralContract.getMarketplaceContract();
    expect(result).to.equal(signers[0].address);

    await nftCollateralContract.connect(signers[10])
      .setNftContract(signers[0].address);
    result = await nftCollateralContract.getNftContract();
    expect(result).to.equal(signers[0].address);

    await nftCollateralContract.connect(signers[10])
      .setNEtnaProfileIndex(4);
    result = await nftCollateralContract.getNEtnaProfileIndex();
    expect(Number(result)).to.equal(4);
  });

  it("Manager settings", async function () {
    await blContract.connect(signers[10]).addToManagers(signers[9].address);

    result = await blContract.getBorrowingProfile(1);
    expect(Number(result.usdRate)).to.equal(10000);
    await expect(
      blContract.connect(signers[8]).setBorrowingProfileRate(1, 2000)
    ).to.be.revertedWith('63')
    await blContract.connect(signers[9]).setBorrowingProfileRate(1, 2000);
    result = await blContract.getBorrowingProfile(1);
    expect(Number(result.usdRate)).to.equal(2000);

    result = await blContract.getCollateralProfile(1);
    expect(Number(result.usdRate)).to.equal(5000);
    await expect(
      blContract.connect(signers[8]).setCollateralProfileRate(1, 2000)
    ).to.be.revertedWith('63')
    await blContract.connect(signers[9]).setCollateralProfileRate(1, 2000);
    result = await blContract.getCollateralProfile(1);
    expect(Number(result.usdRate)).to.equal(2000);

    await blContract.connect(signers[0]).depositCollateral(
      1, ethers.utils.parseUnits('1000')
    );
    result = await blContract.getCollateral(1);
    expect(result.liquidated).to.be.false;
    await expect(
      blContract.connect(signers[8]).setCollateralLiquidationStatus(1, true)
    ).to.be.revertedWith('63')
    await blContract.connect(signers[9]).setCollateralLiquidationStatus(1, true);
    result = await blContract.getCollateral(1);
    expect(result.liquidated).to.be.true;
    await blContract.connect(signers[9]).setCollateralLiquidationStatus(1, false);
    result = await blContract.getCollateral(1);
    expect(result.liquidated).to.be.false;

    await blContract.connect(signers[0]).lend(
      1, ethers.utils.parseUnits('100')
    );
    await blContract.connect(signers[0]).borrow(
      1, ethers.utils.parseUnits('10'), false
    );
    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.false;
    await expect(
      blContract.connect(signers[8]).setBorrowingLiquidationStatus(1, true)
    ).to.be.revertedWith('63')
    await blContract.connect(signers[9]).setBorrowingLiquidationStatus(1, true);
    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.true;
    await blContract.connect(signers[9]).setBorrowingLiquidationStatus(1, false);
    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.false;

    result = await blContract.getBorrowingProfile(1);
    expect(result.active).to.be.true;
    await blContract.connect(signers[9]).setBorrowingProfileStatus(1, false);
    result = await blContract.getBorrowingProfile(1);
    expect(result.active).to.be.false;
    await blContract.connect(signers[9]).setBorrowingProfileStatus(1, true);
    result = await blContract.getBorrowingProfile(1);
    expect(result.active).to.be.true;

    result = await blContract.getCollateralProfile(1);
    expect(result.active).to.be.true;
    await blContract.connect(signers[9]).setCollateralProfileStatus(1, false);
    result = await blContract.getCollateralProfile(1);
    expect(result.active).to.be.false;
    await blContract.connect(signers[9]).setCollateralProfileStatus(1, true);
    result = await blContract.getCollateralProfile(1);
    expect(result.active).to.be.true;

    await blContract.connect(signers[9]).setCollateralProfileBorrowingFactor(1, 11);
    result = await blContract.getCollateralProfile(1);
    expect(Number(result.borrowingFactor)).to.equal(11);

    await blContract.connect(signers[9]).setCollateralProfileLiquidationFactor(1, 22);
    result = await blContract.getCollateralProfile(1);
    expect(Number(result.liquidationFactor)).to.equal(22);

    await blContract.connect(signers[9]).setAprSettings(
      11, 22, 33, 44, 55
    );
    result = await blContract.getAprSettings();
    expect(Number(result[0])).to.equal(11);
    expect(Number(result[1])).to.equal(22);
    expect(Number(result[2])).to.equal(33);
    expect(Number(result[3])).to.equal(44);
    expect(Number(result[4])).to.equal(55);

    await blContract.connect(signers[9]).setLockTime(333);
    result = await blContract.getLockTime();
    expect(Number(result)).to.equal(333);

    await blContract.connect(signers[9]).setLiquidationFee(444);
    result = await blContract.getLiquidationFee();
    expect(Number(result)).to.equal(444);

    await blContract.connect(signers[9]).setLiquidatorPercentage(555);
    result = await blContract.getLiquidatorPercentage();
    expect(Number(result)).to.equal(555);

    await blContract.connect(signers[9]).setLiquidationFlagMargin(666);
    result = await blContract.getLiquidationFlagMargin();
    expect(Number(result)).to.equal(666);

    await blContract.connect(signers[9]).setLiquidationPeriod(777);
    result = await blContract.getLiquidationPeriod();
    expect(Number(result)).to.equal(777);

    await expect(
      blContract.connect(signers[3]).setEtnaContract(signers[10].address)
    )
      .to.be.revertedWith('63');
    await blContract.connect(signers[9])
      .setEtnaContract(signers[10].address);
    result = await blContract.getEtnaContract();
    expect(result).to.equal(signers[10].address);
    await blContract.connect(signers[9])
      .setEtnaContract(etnaContract.address);
    result = await blContract.getEtnaContract();
    expect(result).to.equal(etnaContract.address);

    await expect(
      blContract.connect(signers[3]).setNEtnaContract(signers[10].address)
    )
      .to.be.revertedWith('63');
    await blContract.connect(signers[9])
      .setNEtnaContract(signers[10].address);
    result = await blContract.getNEtnaContract();
    expect(result).to.equal(signers[10].address);
    await blContract.connect(signers[9])
      .setNEtnaContract(etnaContract.address);
    result = await blContract.getNEtnaContract();
    expect(result).to.equal(etnaContract.address);

    await expect(
      nftCollateralContract.connect(signers[9])
        .setNEtnaContract(signers[10].address)
    ).to.be.revertedWith('Caller is not the manager');
    await nftCollateralContract.connect(signers[10])
      .addToManagers(signers[9].address);
    await nftCollateralContract.connect(signers[9])
      .setNEtnaContract(signers[10].address);
    result = await nftCollateralContract.getNEtnaContract();
    expect(result).to.equal(signers[10].address);
    await nftCollateralContract.connect(signers[9])
      .setBorrowingLendingContract(signers[10].address);
    result = await nftCollateralContract.getBorrowingLendingContract();
    expect(result).to.equal(signers[10].address);
    await nftCollateralContract.connect(signers[9])
      .setMarketplaceContract(signers[10].address);
    result = await nftCollateralContract.getMarketplaceContract();
    expect(result).to.equal(signers[10].address);
    await nftCollateralContract.connect(signers[9])
      .setNftContract(signers[10].address);
    result = await nftCollateralContract.getNftContract();
    expect(result).to.equal(signers[10].address);
  });

  it("Admin withdraw/replenish", async function () {
    const collateral = 100;

    const collateral1BLBalance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    const collateral2BLBalance = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(blContract.address)
    ));
    const collateral3BLBalance = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(blContract.address)
    ));

    const s1BLBalance = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[10].address)
    ));
    const s2BLBalance = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[10].address)
    ));
    const s3BLBalance = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(signers[10].address)
    ));

    await blContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral.toString()));
    await blContract.connect(signers[2])
      .depositCollateral(2, ethers.utils.parseUnits(collateral.toString()));
    await blContract.connect(signers[3])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral.toString()),
        {value: ethers.utils.parseUnits(collateral.toString())}
      );

    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(collateral1BLBalance + collateral);
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(collateral2BLBalance + collateral);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(blContract.address)
    ));
    expect(result).to.equal(collateral3BLBalance + collateral);

    await expect(
      blContract.connect(signers[9])
        .adminWithdraw(
          collateralContract.address, ethers.utils.parseUnits(collateral.toString())
        )
    ).to.be.revertedWith('62');
    await expect(
      blContract.connect(signers[8])
        .adminWithdraw(
          etnaContract.address, ethers.utils.parseUnits(collateral.toString())
        )
    ).to.be.revertedWith('62');
    await expect(
      blContract.connect(signers[0])
        .adminWithdraw(zeroAddress, ethers.utils.parseUnits(collateral.toString()))
    ).to.be.revertedWith('62');

    await blContract.connect(signers[10])
      .adminWithdraw(
        etnaContract.address, ethers.utils.parseUnits(collateral.toString())
      );
    await blContract.connect(signers[10])
      .adminWithdraw(
        collateralContract.address, ethers.utils.parseUnits(collateral.toString())
      );
    await blContract.connect(signers[10])
      .adminWithdraw(zeroAddress, ethers.utils.parseUnits(collateral.toString()));

    result = Number(ethers.utils.formatUnits(
      await blContract.getAdminWithdraw(etnaContract.address)
    ));
    expect(result).to.equal(collateral);
    result = Number(ethers.utils.formatUnits(
      await blContract.getAdminWithdraw(collateralContract.address)
    ));
    expect(result).to.equal(collateral);
    result = Number(ethers.utils.formatUnits(
      await blContract.getAdminWithdraw(zeroAddress)
    ));
    expect(result).to.equal(collateral);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(collateral1BLBalance);
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(collateral2BLBalance);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(blContract.address)
    ));
    expect(result).to.equal(collateral3BLBalance);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[10].address)
    ));
    expect(result).to.equal(s1BLBalance + collateral);
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[10].address)
    ));
    expect(result).to.equal(s2BLBalance + collateral);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(signers[10].address)
    ));
    expect(roundTo(result, 1)).to.equal(roundTo(s3BLBalance + collateral, 1));

    const replenishAmount = 100;
    await blContract.connect(signers[10])
      .adminReplenish(
        etnaContract.address, ethers.utils.parseUnits(replenishAmount.toString())
      );
    await blContract.connect(signers[10])
      .adminReplenish(
        collateralContract.address, ethers.utils.parseUnits((replenishAmount + 10).toString())
      );
    await blContract.connect(signers[10])
      .adminReplenish(
        zeroAddress, 0
        , {value: ethers.utils.parseUnits((replenishAmount - 10).toString())}
      );
    result = Number(ethers.utils.formatUnits(
      await blContract.getAdminReplenish(etnaContract.address)
    ));
    expect(result).to.equal(replenishAmount);
    result = Number(ethers.utils.formatUnits(
      await blContract.getAdminReplenish(collateralContract.address)
    ));
    expect(result).to.equal(replenishAmount + 10);
    result = Number(ethers.utils.formatUnits(
      await blContract.getAdminReplenish(zeroAddress)
    ));
    expect(result).to.equal(replenishAmount - 10);

    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(collateral1BLBalance + replenishAmount + 10);
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(blContract.address)
    ));
    expect(result).to.equal(collateral2BLBalance + replenishAmount);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(blContract.address)
    ));
    expect(result).to.equal(collateral3BLBalance + replenishAmount - 10);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.balanceOf(signers[10].address)
    ));
    expect(result).to.equal(s1BLBalance + collateral - (replenishAmount + 10));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[10].address)
    ));
    expect(result).to.equal(s2BLBalance + collateral - replenishAmount);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.provider.getBalance(signers[10].address)
    ));
    expect(roundTo(result, 1)).to.equal(roundTo(s3BLBalance + collateral - (replenishAmount - 10), 1));

    await nftCollateralContract.connect(signers[0])
      .depositNftCollateral([1,2,3]);

    result = await nftContract.ownerOf(1);
    expect(result).to.equal(nftCollateralContract.address);
    result = await nftContract.ownerOf(2);
    expect(result).to.equal(nftCollateralContract.address);
    result = await nftContract.ownerOf(3);
    expect(result).to.equal(nftCollateralContract.address);

    result = await nftCollateralContract.connect(signers[10])
      .adminWithdrawNft([1,2,4]);

    result = await nftContract.ownerOf(1);
    expect(result).to.equal(signers[10].address);
    result = await nftContract.ownerOf(2);
    expect(result).to.equal(signers[10].address);
    result = await nftContract.ownerOf(3);
    expect(result).to.equal(nftCollateralContract.address);

    const withdrawAmount = 100;
    await borrowing1Contract.transfer(
      nftCollateralContract.address, ethers.utils.parseUnits((withdrawAmount * 2).toString())
    );
    const netnaBalanceContract = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(nftCollateralContract.address)
    ));
    const netnaBalanceS10 = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(signers[10].address)
    ));
    const borrowing1BalanceContract = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(nftCollateralContract.address)
    ));
    const borrowing1BalanceS10 = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(signers[10].address)
    ));

    await nftCollateralContract.connect(signers[10])
      .adminWithdrawNEtna(
        ethers.utils.parseUnits(withdrawAmount.toString())
      );

    await nftCollateralContract.connect(signers[10])
      .adminWithdrawToken(
        borrowing1Contract.address, ethers.utils.parseUnits(withdrawAmount.toString())
      );

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(nftCollateralContract.address)
    ));
    expect(result).to.equal(netnaBalanceContract - withdrawAmount);
    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(signers[10].address)
    ));
    expect(result).to.equal(netnaBalanceS10 + withdrawAmount);
    result = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(nftCollateralContract.address)
    ));
    expect(result).to.equal(borrowing1BalanceContract - withdrawAmount);
    result = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(signers[10].address)
    ));
    expect(result).to.equal(borrowing1BalanceS10 + withdrawAmount);
  });
});

function roundTo(a, b) {
  a = Number(a);
  b = Number(b);
  if (isNaN(a) || !(b > 0)) return null;
  b = 10 ** b;
  return Math.round(a * b) / b;
}
