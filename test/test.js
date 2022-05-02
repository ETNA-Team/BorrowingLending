const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const hre = require("hardhat");
chai.use(chaiAsPromised);
const expect = chai.expect;
const { ethers } = require("hardhat");
const initialEtnaTransfer = 50000;
const batchLimit = 50;
const zeroAddress = '0x0000000000000000000000000000000000000000';
let signers, tokensArray, proxyContract, etnaContract, mtbContract, nEtnaContract, erc20CollateralContract, erc20Collateral2Contract, lpContract, marketplaceContract, nftContract, borrowing1Contract, borrowing2Contract, borrowing3Contract, collateralContract, nftCollateralContract, blContract, rewardContract, result;

const collateralProfileLiquidationFactor = 2000;
const collateral1ProfileUsdRate = 0.5;
const collateral1ProfileBorrowingFactor = 2500;
const collateral2ProfileUsdRate = 0.2;
const collateral2ProfileBorrowingFactor = 1500;
const collateral3ProfileUsdRate = 600;
const collateral3ProfileBorrowingFactor = 5000;
const collateral4ProfileUsdRate = 0.2;
const collateral4ProfileBorrowingFactor = 1500;
const collateral5ProfileUsdRate = 0.01;
const collateral5ProfileBorrowingFactor = 1000;

const duration = 365 * 24 * 3600;
let rewardPool = 100000;

beforeEach(async function () {
  signers = await ethers.getSigners();

  const Proxy = await ethers.getContractFactory("Proxy");
  proxyContract = await Proxy.deploy(
    signers[10].address
  );
  await proxyContract.deployed();

  const LP = await ethers.getContractFactory("LPToken");
  lpContract = await LP.deploy(signers[10].address, 'LP token', 'LP token', ethers.utils.parseUnits('1000000'), 18);
  await lpContract.deployed();

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

  mtbContract = await ERC20.deploy(
    signers[10].address, 'ETNA', 'ETNA', ethers.utils.parseUnits('1000000'), 18
  );
  await mtbContract.deployed();

  await mtbContract.connect(signers[10])
    .transfer(signers[0].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await mtbContract.connect(signers[10])
    .transfer(signers[1].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await mtbContract.connect(signers[10])
    .transfer(signers[2].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await mtbContract.connect(signers[10])
    .transfer(signers[3].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await mtbContract.connect(signers[10])
    .transfer(signers[4].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  nEtnaContract = await ERC20.deploy(
    signers[10].address, 'NETNA', 'NETNA', ethers.utils.parseUnits('1000000'), 18
  );
  await nEtnaContract.deployed();

  erc20CollateralContract = await ERC20.deploy(
    signers[10].address, 'TEST', 'TEST', ethers.utils.parseUnits('1000000'), 18
  );
  await erc20CollateralContract.deployed();

  await erc20CollateralContract.connect(signers[10])
    .transfer(signers[0].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[10])
    .transfer(signers[1].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[10])
    .transfer(signers[2].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[10])
    .transfer(signers[3].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[10])
    .transfer(signers[4].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  erc20CollateralContract = await ERC20.deploy(
    signers[10].address, 'TEST', 'TEST', ethers.utils.parseUnits('1000000'), 18
  );
  await erc20CollateralContract.deployed();

  await erc20CollateralContract.connect(signers[10])
    .transfer(signers[0].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[10])
    .transfer(signers[1].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[10])
    .transfer(signers[2].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[10])
    .transfer(signers[3].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[10])
    .transfer(signers[4].address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  erc20Collateral2Contract = await ERC20.deploy(
    signers[10].address, 'TEST2', 'TEST2', ethers.utils.parseUnits('1000000'), 8
  );
  await erc20Collateral2Contract.deployed();

  await erc20Collateral2Contract.connect(signers[10])
    .transfer(signers[0].address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 8));
  await erc20Collateral2Contract.connect(signers[10])
    .transfer(signers[1].address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 8));
  await erc20Collateral2Contract.connect(signers[10])
    .transfer(signers[2].address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 8));
  await erc20Collateral2Contract.connect(signers[10])
    .transfer(signers[3].address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 8));
  await erc20Collateral2Contract.connect(signers[10])
    .transfer(signers[4].address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 8));

  borrowing1Contract = await ERC20.deploy(
    signers[10].address, 'BUSD', 'BUSD', ethers.utils.parseUnits('1000000'), 6
  );
  await borrowing1Contract.deployed();

  await borrowing1Contract.connect(signers[10])
    .transfer(signers[0].address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));
  await borrowing1Contract.connect(signers[10])
    .transfer(signers[1].address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));
  await borrowing1Contract.connect(signers[10])
    .transfer(signers[2].address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));
  await borrowing1Contract.connect(signers[10])
    .transfer(signers[3].address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));
  await borrowing1Contract.connect(signers[10])
    .transfer(signers[4].address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));
  await borrowing1Contract.connect(signers[10])
    .transfer(signers[7].address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));

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

  borrowing3Contract = await ERC20.deploy(
    signers[10].address, 'USDC', 'USDC', ethers.utils.parseUnits('1000000'), 6
  );
  await borrowing3Contract.deployed();

  await borrowing3Contract.connect(signers[10])
    .transfer(signers[0].address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 6));
  await borrowing3Contract.connect(signers[10])
    .transfer(signers[1].address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 6));
  await borrowing3Contract.connect(signers[10])
    .transfer(signers[2].address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 6));

  await borrowing3Contract.connect(signers[10])
    .transfer(signers[3].address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 6));
  await borrowing3Contract.connect(signers[10])
    .transfer(signers[4].address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 6));

  const BorrowingLending = await ethers.getContractFactory("BorrowingLendingContract");
  blContract = await BorrowingLending.connect(signers[10]).deploy(
    signers[10].address, // owner
    2000,
    4000,
    500,
    1000,
    3000
  );
  await blContract.deployed();
  await blContract.connect(signers[10])
    .setProxyContract(
      proxyContract.address
    );
  
  const Collateral = await ethers.getContractFactory("CollateralWithLiquidationContract");
  collateralContract = await Collateral.connect(signers[10]).deploy(
    signers[10].address, // owner
    etnaContract.address,
    blContract.address
  );
  await collateralContract.deployed();
  await collateralContract.connect(signers[10])
    .setProxyContract(
      proxyContract.address
    );
  await blContract.connect(signers[10])
    .setCollateralContract(
      collateralContract.address
    );

  await etnaContract.connect(signers[0])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[1])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[2])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[3])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[4])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await etnaContract.connect(signers[10])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  await mtbContract.connect(signers[0])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await mtbContract.connect(signers[1])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await mtbContract.connect(signers[2])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await mtbContract.connect(signers[3])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await mtbContract.connect(signers[4])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await mtbContract.connect(signers[10])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  await erc20CollateralContract.connect(signers[0])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[1])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[2])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[3])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[4])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));
  await erc20CollateralContract.connect(signers[10])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString()));

  await erc20Collateral2Contract.connect(signers[0])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 8));
  await erc20Collateral2Contract.connect(signers[1])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 8));
  await erc20Collateral2Contract.connect(signers[2])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 8));
  await erc20Collateral2Contract.connect(signers[3])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 8));
  await erc20Collateral2Contract.connect(signers[4])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 8));
  await erc20Collateral2Contract.connect(signers[10])
    .approve(collateralContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 8));

  await borrowing1Contract.connect(signers[0])
    .approve(blContract.address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));
  await borrowing1Contract.connect(signers[1])
    .approve(blContract.address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));
  await borrowing1Contract.connect(signers[2])
    .approve(blContract.address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));
  await borrowing1Contract.connect(signers[3])
    .approve(blContract.address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));
  await borrowing1Contract.connect(signers[4])
    .approve(blContract.address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));
  await borrowing1Contract.connect(signers[7])
    .approve(blContract.address, ethers.utils.parseUnits(
      initialEtnaTransfer.toString(), 6
    ));

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

  await borrowing3Contract.connect(signers[0])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 6));
  await borrowing3Contract.connect(signers[1])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 6));
  await borrowing3Contract.connect(signers[2])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 6));
  await borrowing3Contract.connect(signers[3])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 6));
  await borrowing3Contract.connect(signers[4])
    .approve(blContract.address, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 6));

  await blContract.connect(signers[10]).addToManagers(signers[9].address);
  await collateralContract.connect(signers[10]).addToManagers(signers[9].address);
  await expect(
    blContract.connect(signers[0]).addBorrowingProfile(borrowing1Contract.address)
  ).to.be.revertedWith('63');

  await blContract.connect(signers[9])
    .addBorrowingProfile(borrowing1Contract.address);
  await blContract.connect(signers[9]).setUsdRateData(
    borrowing1Contract.address,
    ethers.utils.parseUnits('1', 30),
    false
  );
  await blContract.connect(signers[9])
    .addBorrowingProfile(borrowing2Contract.address);
  await blContract.connect(signers[9]).setUsdRateData(
    borrowing2Contract.address,
    ethers.utils.parseUnits('1'),
    false
  );

  await collateralContract.connect(signers[9]).addCollateralProfile(
    erc20CollateralContract.address,
    collateral1ProfileBorrowingFactor,
    1,
    false
  );
  await collateralContract.connect(signers[9]).setUsdRateData(
    erc20CollateralContract.address,
    0,
    true
  );
  await collateralContract.connect(signers[9]).addCollateralProfile(
    etnaContract.address,
    collateral2ProfileBorrowingFactor,
    2,
    true
  );
  await collateralContract.connect(signers[9]).setUsdRateData(
    etnaContract.address,
    0,
    true
  );
  await collateralContract.connect(signers[9]).addCollateralProfile(
    zeroAddress,
    collateral3ProfileBorrowingFactor,
    0,
    false
  );
  await collateralContract.connect(signers[9]).setUsdRateData(
    zeroAddress,
    0,
    true
  );
  await collateralContract.connect(signers[9]).setNEtnaContract(nEtnaContract.address);
  await collateralContract.connect(signers[9]).addCollateralProfile(
    nEtnaContract.address,
    collateral4ProfileBorrowingFactor,
    4,
    true
  );
  await collateralContract.connect(signers[9]).setUsdRateData(
    nEtnaContract.address,
    0,
    true
  );
  await collateralContract.connect(signers[9]).addCollateralProfile(
    mtbContract.address,
    collateral5ProfileBorrowingFactor,
    3,
    false
  );
  await collateralContract.connect(signers[9]).setUsdRateData(
    mtbContract.address,
    0,
    true
  );

  await proxyContract.connect(signers[10])
    .setUsdRateData(
      erc20CollateralContract.address,
      zeroAddress,
      zeroAddress,
      ethers.utils.parseUnits(collateral1ProfileUsdRate.toString()),
      0,
      18,
      18,
      18,
      false
    );
  await proxyContract.connect(signers[10])
    .setUsdRateData(
      etnaContract.address,
      zeroAddress,
      zeroAddress,
      ethers.utils.parseUnits(collateral2ProfileUsdRate.toString()),
      0,
      18,
      18,
      18,
      false
    );
  await proxyContract.connect(signers[10])
    .setUsdRateData(
      mtbContract.address,
      zeroAddress,
      zeroAddress,
      ethers.utils.parseUnits(collateral5ProfileUsdRate.toString()),
      0,
      18,
      18,
      18,
      false
    );

  await proxyContract.connect(signers[10])
    .setUsdRateData(
      nEtnaContract.address,
      zeroAddress,
      zeroAddress,
      ethers.utils.parseUnits(collateral4ProfileUsdRate.toString()),
      0,
      18,
      18,
      18,
      false
    );
  await proxyContract.connect(signers[10])
    .setUsdRateData(
      zeroAddress,
      zeroAddress,
      zeroAddress,
      ethers.utils.parseUnits(collateral3ProfileUsdRate.toString()),
      0,
      18,
      18,
      18,
      false
    );

  result = await blContract.getBorrowingProfilesNumber();
  expect(Number(result)).to.equal(2);
  result = await collateralContract.getCollateralProfilesNumber();
  expect(Number(result)).to.equal(5);
  result = await blContract.getBorrowingProfile(1);
  expect(result.contractAddress).to.equal(borrowing1Contract.address);
  expect(Number(result.totalBorrowed)).to.equal(0);
  expect(Number(result.totalLent)).to.equal(0);
  expect(result.active).to.be.true;

  result = await blContract.getBorrowingProfile(2);
  expect(result.contractAddress).to.equal(borrowing2Contract.address);
  expect(Number(result.totalBorrowed)).to.equal(0);
  expect(Number(result.totalLent)).to.equal(0);
  expect(result.active).to.be.true;

  result = await collateralContract.getCollateralProfile(1);
  expect(result.contractAddress).to.equal(erc20CollateralContract.address);
  expect(Number(result.borrowingFactor)).to.equal(collateral1ProfileBorrowingFactor);
  expect(Number(result.total)).to.equal(0);
  expect(Number(result.order)).to.equal(1);
  expect(result.active).to.be.true;

  result = await collateralContract.getUsdRate(erc20CollateralContract.address);
  expect(Number(ethers.utils.formatUnits(result)))
    .to.equal(collateral1ProfileUsdRate);

  result = await collateralContract.getCollateralProfile(2);
  expect(result.contractAddress).to.equal(etnaContract.address);
  expect(Number(result.borrowingFactor)).to.equal(collateral2ProfileBorrowingFactor);
  expect(Number(result.total)).to.equal(0);
  expect(Number(result.order)).to.equal(2);
  expect(result.active).to.be.true;
  result = await collateralContract.getUsdRate(etnaContract.address);
  expect(Number(ethers.utils.formatUnits(result)))
    .to.equal(collateral2ProfileUsdRate);

  result = await collateralContract.getCollateralProfile(3);
  expect(result.contractAddress).to.equal(zeroAddress);
  expect(Number(result.borrowingFactor)).to.equal(collateral3ProfileBorrowingFactor);
  expect(Number(result.total)).to.equal(0);
  expect(Number(result.order)).to.equal(0);
  expect(result.active).to.be.true;
  result = await collateralContract.getUsdRate(zeroAddress);
  expect(Number(ethers.utils.formatUnits(result)))
    .to.equal(collateral3ProfileUsdRate);

  result = await collateralContract.getCollateralProfile(4);
  expect(result.contractAddress).to.equal(nEtnaContract.address);
  expect(Number(result.borrowingFactor)).to.equal(collateral4ProfileBorrowingFactor);
  expect(Number(result.total)).to.equal(0);
  expect(Number(result.order)).to.equal(4);
  expect(result.active).to.be.true;
  result = await collateralContract.getUsdRate(nEtnaContract.address);
  expect(Number(ethers.utils.formatUnits(result)))
    .to.equal(collateral4ProfileUsdRate);

  result = await collateralContract.getCollateralProfile(5);
  expect(result.contractAddress).to.equal(mtbContract.address);
  expect(Number(result.borrowingFactor)).to.equal(collateral5ProfileBorrowingFactor);
  expect(Number(result.total)).to.equal(0);
  expect(Number(result.order)).to.equal(3);
  expect(result.active).to.be.true;
  result = await collateralContract.getUsdRate(mtbContract.address);
  expect(Number(ethers.utils.formatUnits(result)))
    .to.equal(collateral5ProfileUsdRate);

  const Nft = await ethers.getContractFactory("CyclopsTokens");
  nftContract = await Nft.connect(signers[10]).deploy();
  await nftContract.deployed();

  const Marketplace = await ethers.getContractFactory("NFTMarketplace");
  marketplaceContract = await Marketplace.connect(signers[10]).deploy(nftContract.address, etnaContract.address, 0);
  await marketplaceContract.deployed();

  const NftCollateral = await ethers.getContractFactory("NftCollateral");
  await expect(
    NftCollateral.connect(signers[10]).deploy(
      marketplaceContract.address,
      nftContract.address,
      collateralContract.address,
      signers[10].address,
      3
    )
  ).to.be.revertedWith('Wrong NETNA collateral profile index');
  nftCollateralContract = await NftCollateral.connect(signers[10]).deploy(
    marketplaceContract.address,
    nftContract.address,
    collateralContract.address,
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

  await collateralContract.connect(signers[9])
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

  const RewardPerBlock = await ethers.getContractFactory("RewardPerBlock");

  rewardContract = await RewardPerBlock.connect(signers[10]).deploy(
    signers[10].address,
    etnaContract.address,
    blContract.address,
    proxyContract.address,
    duration,
    ethers.utils.parseUnits(rewardPool.toString()),
    3000
  );
  await rewardContract.deployed();
  await etnaContract.connect(signers[10]).transfer(
    rewardContract.address, ethers.utils.parseUnits('100000')
  );
  await blContract.connect(signers[10])
    .setRewardContract(rewardContract.address);

  expect(await blContract.getRewardContract()).to.equal(rewardContract.address);
  expect(Number(await rewardContract.getRewardPercentage(1)))
    .to.equal(5000);
  expect(Number(await rewardContract.getRewardPercentage(2)))
    .to.equal(5000);
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
    await blContract.connect(signers[0]).lend(
      1, ethers.utils.parseUnits(lending11Amount.toString(), 6)
    );
    result = await blContract.getLendingsNumber();
    expect(Number(result)).to.equal(1);
    result = await blContract.getLending(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(ethers.utils.formatUnits(result.amount, 6))).to.equal(lending11Amount);
    expect(Number(ethers.utils.formatUnits(result.accumulatedYield, 6))).to.equal(0);
    await blContract.connect(signers[1]).lend(
      1, ethers.utils.parseUnits(lending21Amount.toString(), 6)
    );
    result = await blContract.getLendingsNumber();
    expect(Number(result)).to.equal(2);
    await blContract.connect(signers[0]).lend(
      2, ethers.utils.parseUnits(lending321Amount.toString())
    );
    result = await blContract.getLendingsNumber();
    expect(Number(result)).to.equal(3);
    await blContract.connect(signers[0]).lend(2, ethers.utils.parseUnits(lending322Amount.toString()));
    result = await blContract.getLendingsNumber();
    expect(Number(result)).to.equal(3);
    result = await blContract.getLending(2);
    expect(result.userAddress).to.equal(signers[1].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(ethers.utils.formatUnits(result.amount, 6))).to.equal(lending21Amount);
    expect(Number(ethers.utils.formatUnits(result.accumulatedYield, 6))).to.equal(0);
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
    expect(roundTo(Number(ethers.utils.formatUnits(result, 6)), 4)).to
      .equal(roundTo(lending11ExpectedYield, 4));
    const lending21ExpectedYield = lending21Amount * minLendingApr / 100 * 100 / 365;
    result = await blContract.getLendingYield(2, true);
    expect(roundTo(Number(ethers.utils.formatUnits(result, 6)), 4)).to
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
      await borrowing1Contract.balanceOf(signers[0].address), 6
    ));

    const borrowing2S0Balance = Number(ethers.utils.formatUnits(
      await borrowing2Contract.balanceOf(signers[0].address)
    ));
    await collateralContract.connect(signers[2]).depositCollateral(
      2, ethers.utils.parseUnits(borrowing2CollateralAmount.toString())
    );
    await blContract.connect(signers[2]).borrow(
      2, ethers.utils.parseUnits(borrowing2Amount.toString(), 6), false
    );
    const lending323Apr = Number(await blContract.getLendingApr(2)) / 10000;

    await blContract.connect(signers[0]).withdrawLending(
      1, ethers.utils.parseUnits(lending11WithdrawnAmount.toString(), 6)
    );
    result = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(signers[0].address), 6
    ));


    expect(roundTo(result, 4)).to.equal(roundTo(
    borrowing1S0Balance + lending11WithdrawnAmount, 4
    ));
    await blContract.connect(signers[0]).withdrawLendingYield(
      1, ethers.utils.parseUnits(lending11ExpectedYield.toFixed(6), 6)
    );

    result = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(signers[0].address), 6
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
    expect(Number(ethers.utils.formatUnits(result.amount, 6))).to.equal(borrowing2Amount);
    result = await blContract.getLending(1);
    expect(Number(ethers.utils.formatUnits(result.amount, 6))).to.equal(0);
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

  it("Lending - margin withdraw", async function () {
    const lendingAmount = 100;
    const borrowingAmount = 95;
    const collateralAmount = 5000;

    await blContract.connect(signers[1])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));
    await collateralContract.connect(signers[2])
      .depositCollateral(1, ethers.utils.parseUnits(collateralAmount.toString()));
    await blContract.connect(signers[2])
      .borrow(1, ethers.utils.parseUnits(borrowingAmount.toString(), 6), false);
    await expect(
      blContract.connect(signers[1])
        .withdrawLending(1, ethers.utils.parseUnits('0.1', 6))
    ).to.be.revertedWith('47.1');
    await blContract.connect(signers[3])
      .lend(1, ethers.utils.parseUnits('10', 6));
    await expect(
      blContract.connect(signers[1])
        .withdrawLending(1, ethers.utils.parseUnits('10.1', 6))
    ).to.be.revertedWith('47.1');
    await blContract.connect(signers[1])
        .withdrawLending(1, ethers.utils.parseUnits('10', 6));
  });

  it("Borrowing", async function () {
    result = await borrowing1Contract.balanceOf(blContract.address);
    let balanceBlBorrowing1Contract = Number(ethers.utils.formatUnits(result, 6));
    result = await erc20CollateralContract.balanceOf(collateralContract.address);
    let balanceBlCollateralContract = Number(ethers.utils.formatUnits(result));

    const lendingAmount = 8000;
    const lendingAmount2 = 1000;
    const borrowingAmount = 100;
    const toBeReturned = 50;
    const collateralAmount = 5000;

    await blContract.connect(signers[0]).lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));

    result = await borrowing1Contract.balanceOf(blContract.address);
    expect(Number(ethers.utils.formatUnits(result, 6))).to
      .equal(balanceBlBorrowing1Contract + lendingAmount);

    result = await blContract.getBorrowingApr(1);
    expect(Number(result)).to.equal(2000);
    result = await blContract.getLendingApr(1);
    expect(Number(result)).to.equal(1000);

    result = await borrowing1Contract.balanceOf(signers[1].address);
    let balanceS1Borrowing1Contract = Number(ethers.utils.formatUnits(result, 6));
    result = await erc20CollateralContract.balanceOf(signers[1].address);
    let balanceS1CollateralContract = Number(ethers.utils.formatUnits(result));


    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateralAmount.toString()));

    result = await collateralContract.getCollateralProfile(1);
    let usdRate = collateral1ProfileUsdRate;
    let borrowingFactor = Number(result.borrowingFactor) / 10000;
    let availableBorrowingAmount = collateralAmount * usdRate * borrowingFactor;
    expect(Number(ethers.utils.formatUnits(result.total))).to.equal(collateralAmount);

    result = await collateralContract.getCollateral(1);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(collateralAmount);
    result = await blContract.getAvailableBorrowingAmount(signers[1].address, 1);
    expect(Number(ethers.utils.formatUnits(result, 6))).to.equal(availableBorrowingAmount);

    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowingAmount.toString(), 6), false);
    result = await borrowing1Contract.balanceOf(signers[1].address);
    expect(Number(ethers.utils.formatUnits(result, 6))).to
      .equal(balanceS1Borrowing1Contract + borrowingAmount);
    result = await borrowing1Contract.balanceOf(blContract.address);
    expect(Number(ethers.utils.formatUnits(result, 6))).to
      .equal(balanceBlBorrowing1Contract + lendingAmount - borrowingAmount);
    result = await erc20CollateralContract.balanceOf(signers[1].address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceS1CollateralContract - collateralAmount);
    result = await erc20CollateralContract.balanceOf(collateralContract.address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceBlCollateralContract + collateralAmount);
    result = await blContract.getBorrowing(1);
    expect(result.userAddress).to.equal(signers[1].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(ethers.utils.formatUnits(result.amount, 6))).to.equal(borrowingAmount);
    expect(Number(ethers.utils.formatUnits(result.accumulatedFee, 6))).to.equal(0);
    result = await collateralContract.getCollateral(1);
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
      .lend(1, ethers.utils.parseUnits(lendingAmount2.toString(), 6));
    result = await blContract.getBorrowing(1);
    expect(Number(ethers.utils.formatUnits(result.accumulatedFee, 6))).to.equal(0);
    result = await blContract.getBorrowingFee(1, true);
    const expectedBorrowingFee = borrowingAmount * expectedBorrowingApr / 10000 * 100 / 365;
    expect(roundTo(expectedBorrowingFee, 4)).to
      .equal(roundTo(Number(ethers.utils.formatUnits(result, 6)), 4));

    await blContract.connect(signers[1])
      .returnBorrowing(1, ethers.utils.parseUnits(toBeReturned.toString(), 6), false);
    result = await blContract.getBorrowing(1);

    expect(roundTo(Number(ethers.utils.formatUnits(
      result.amount, 6
    )), 4)).to.equal(roundTo(
      borrowingAmount - toBeReturned + expectedBorrowingFee, 4
    ));
    expect(roundTo(Number(ethers.utils.formatUnits(result.accumulatedFee, 6)), 8)).to
      .equal(0);

    result = await erc20CollateralContract.balanceOf(signers[1].address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceS1CollateralContract - collateralAmount);
    result = await erc20CollateralContract.balanceOf(collateralContract.address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceBlCollateralContract + collateralAmount);
    result = await borrowing1Contract.balanceOf(signers[1].address);
    expect(Number(ethers.utils.formatUnits(result, 6))).to
      .equal(balanceS1Borrowing1Contract + borrowingAmount - toBeReturned);
    result = await borrowing1Contract.balanceOf(blContract.address);
    expect(Number(ethers.utils.formatUnits(result, 6))).to
      .equal(balanceBlBorrowing1Contract + lendingAmount - borrowingAmount + lendingAmount2 + toBeReturned);

    result = await collateralContract.getAvailableCollateralAmount(signers[0].address, 1);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(0);
    const availableCollateralAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getAvailableCollateralAmount(signers[1].address, 1)
    ));
    const expectedAvailableCollateralAmount = collateralAmount - (borrowingAmount - toBeReturned + expectedBorrowingFee) / usdRate / borrowingFactor;
    expect(roundTo(availableCollateralAmount, 4)).to
      .equal(roundTo(expectedAvailableCollateralAmount, 4));

    await expect(
      collateralContract.connect(signers[1])
        .withdrawCollateral(1, ethers.utils.parseUnits((availableCollateralAmount + 1).toString()))
    ).to.be.revertedWith('30');

    const collateral1S1Balance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[1].address)
    ));
    const collateral1BlBalance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));

    await collateralContract.connect(signers[1])
      .withdrawCollateral(
        1, ethers.utils.parseUnits(
          (availableCollateralAmount / 2).toString()
        )
      );

    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[1].address)
    ));
    expect(result).to.equal(collateral1S1Balance + availableCollateralAmount / 2);
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    expect(result).to.equal(collateral1BlBalance - availableCollateralAmount / 2);

    result = await collateralContract.getAvailableCollateralAmount(signers[1].address, 1);
    expect(roundTo(Number(ethers.utils.formatUnits(result)), 3)).to
      .equal(roundTo(availableCollateralAmount / 2, 3));

    await collateralContract.connect(signers[1])
      .withdrawCollateralAvailable(1);

    result = await collateralContract.getAvailableCollateralAmount(signers[1].address, 1);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(0);

    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[1].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1S1Balance + availableCollateralAmount, 4));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1BlBalance - availableCollateralAmount, 4));

    result = await erc20CollateralContract.balanceOf(signers[1].address);
    expect(roundTo(
      Number(ethers.utils.formatUnits(result)), 4
    )).to.equal(roundTo(
      balanceS1CollateralContract - collateralAmount + expectedAvailableCollateralAmount, 4
    ));
    result = await erc20CollateralContract.balanceOf(collateralContract.address);
    expect(roundTo(
      Number(ethers.utils.formatUnits(result)), 4
    )).to
      .equal(roundTo(
      balanceBlCollateralContract + collateralAmount - expectedAvailableCollateralAmount, 4
    ));

    await blContract.connect(signers[1])
      .returnBorrowing(1, 0, true);

    result = await blContract.getBorrowing(1);
    expect(Number(ethers.utils.formatUnits(
      result.amount, 6
    ))).to.equal(0);
    expect(Number(ethers.utils.formatUnits(
      result.accumulatedFee, 6
    ))).to.equal(0);
  });

  it("Update fees when collateral change", async function () {
    result = await borrowing1Contract.balanceOf(blContract.address);
    let balanceBlBorrowing1Contract = Number(ethers.utils.formatUnits(result), 6);
    result = await erc20CollateralContract.balanceOf(collateralContract.address);
    let balanceBlCollateralContract = Number(ethers.utils.formatUnits(result));

    const lendingAmount = 8000;
    const lendingAmount2 = 1000;
    const borrowingAmount = 100;
    const collateral1Amount = 5000;
    const collateral2Amount = 10000;

    await blContract.connect(signers[0]).lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));

    result = await borrowing1Contract.balanceOf(blContract.address);
    expect(Number(ethers.utils.formatUnits(result, 6))).to
      .equal(balanceBlBorrowing1Contract + lendingAmount);

    result = await blContract.getBorrowingApr(1);
    expect(Number(result)).to.equal(2000);
    result = await blContract.getLendingApr(1);
    expect(Number(result)).to.equal(1000);

    result = await borrowing1Contract.balanceOf(signers[1].address);
    let balanceS1Borrowing1Contract = Number(ethers.utils.formatUnits(result, 6));
    result = await erc20CollateralContract.balanceOf(signers[1].address);
    let balanceS1CollateralContract = Number(ethers.utils.formatUnits(result));

    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));

    result = await collateralContract.getCollateralProfile(1);
    let usdRate = collateral1ProfileUsdRate;
    let borrowingFactor = Number(result.borrowingFactor) / 10000;
    let availableBorrowingAmount = collateral1Amount * usdRate * borrowingFactor;
    expect(Number(ethers.utils.formatUnits(result.total))).to.equal(collateral1Amount);

    result = await collateralContract.getCollateral(1);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(collateral1Amount);
    result = await blContract.getAvailableBorrowingAmount(signers[1].address, 1);
    expect(Number(ethers.utils.formatUnits(result, 6))).to.equal(availableBorrowingAmount);
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowingAmount.toString(), 6), false);
    result = await borrowing1Contract.balanceOf(signers[1].address);
    expect(Number(ethers.utils.formatUnits(result, 6))).to
      .equal(balanceS1Borrowing1Contract + borrowingAmount);
    result = await borrowing1Contract.balanceOf(blContract.address);
    expect(Number(ethers.utils.formatUnits(result, 6))).to
      .equal(balanceBlBorrowing1Contract + lendingAmount - borrowingAmount);
    result = await erc20CollateralContract.balanceOf(signers[1].address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceS1CollateralContract - collateral1Amount);
    result = await erc20CollateralContract.balanceOf(collateralContract.address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceBlCollateralContract + collateral1Amount);
    result = await blContract.getBorrowing(1);
    expect(result.userAddress).to.equal(signers[1].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(ethers.utils.formatUnits(result.amount, 6))).to.equal(borrowingAmount);
    expect(Number(ethers.utils.formatUnits(result.accumulatedFee, 6))).to.equal(0);
    result = await collateralContract.getCollateral(1);
    expect(Number(result.collateralProfileIndex)).to.equal(1);
    expect(Number(ethers.utils.formatUnits(result.amount))).to.equal(collateral1Amount);

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
      .lend(1, ethers.utils.parseUnits(lendingAmount2.toString(), 6));
    result = await blContract.getBorrowing(1);
    expect(Number(ethers.utils.formatUnits(result.accumulatedFee, 6))).to.equal(0);
    result = await blContract.getBorrowingFee(1, true);
    const expectedBorrowingFee = borrowingAmount * expectedBorrowingApr / 10000 * 100 / 365;
    expect(roundTo(expectedBorrowingFee, 4)).to
      .equal(roundTo(Number(ethers.utils.formatUnits(result, 6)), 4));

    result = await erc20CollateralContract.balanceOf(signers[1].address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceS1CollateralContract - collateral1Amount);
    result = await erc20CollateralContract.balanceOf(collateralContract.address);
    expect(Number(ethers.utils.formatUnits(result))).to
      .equal(balanceBlCollateralContract + collateral1Amount);

    await collateralContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await collateralContract.connect(signers[1])
      .withdrawCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount2.toString(), 6));
    result = await blContract.getBorrowing(1);
    expect(roundTo(Number(ethers.utils.formatUnits(
      result.accumulatedFee, 6
    )), 4)).to.equal(roundTo(expectedBorrowingFee, 4));
    result = await blContract.getBorrowingFee(1, true);
    expect(roundTo(expectedBorrowingFee, 4)).to
      .equal(roundTo(Number(ethers.utils.formatUnits(result, 6)), 4));
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
    result = await collateralContract.getCollateralProfile(1);
    const collateral1UsdRate = collateral1ProfileUsdRate;
    const collateral1BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateral1BorrowingCapacity = collateral1Amount * collateral1UsdRate
      * collateral1BorrowingFactor;
    result = await collateralContract.getCollateralProfile(2);
    const collateral2UsdRate = collateral2ProfileUsdRate;
    const collateral2BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateral2BorrowingCapacity = collateral2Amount * collateral2UsdRate
      * collateral2BorrowingFactor;
    result = await collateralContract.getCollateralProfile(3);
    const collateral3UsdRate = collateral3ProfileUsdRate;
    const collateral3BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateral3BorrowingCapacity = collateral3Amount * collateral3UsdRate
      * collateral3BorrowingFactor;

    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );

    result = await collateralContract.getCollateralProfileStat(1);
    expect(Number(ethers.utils.formatUnits(
      result.total
    ))).to.equal(collateral1Amount);
    expect(Number(
      result.usersNumber
    )).to.equal(1);
    result = await collateralContract.getCollateralProfileStat(2);
    expect(Number(ethers.utils.formatUnits(
      result.total
    ))).to.equal(collateral2Amount);
    expect(Number(
      result.usersNumber
    )).to.equal(1);
    result = await collateralContract.getCollateralProfileStat(3);
    expect(Number(ethers.utils.formatUnits(
      result.total
    ))).to.equal(collateral3Amount);
    expect(Number(
      result.usersNumber
    )).to.equal(1);

    const collateral1S2Balance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[2].address)
    ));
    const collateral1BlBalance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    const collateral2S2Balance = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[2].address)
    ));
    const collateral2BlBalance = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(collateralContract.address)
    ));
    const collateral3S2Balance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(signers[2].address)
    ));
    const collateral3BlBalance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(collateralContract.address)
    ));

    await collateralContract.connect(signers[2])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await collateralContract.connect(signers[2])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await collateralContract.connect(signers[2])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );

    result = await collateralContract.getCollateralProfileStat(1);
    expect(Number(ethers.utils.formatUnits(
      result.total
    ))).to.equal(collateral1Amount * 2);
    expect(Number(
      result.usersNumber
    )).to.equal(2);
    result = await collateralContract.getCollateralProfileStat(2);
    expect(Number(ethers.utils.formatUnits(
      result.total
    ))).to.equal(collateral2Amount * 2);
    expect(Number(
      result.usersNumber
    )).to.equal(2);
    result = await collateralContract.getCollateralProfileStat(3);
    expect(Number(ethers.utils.formatUnits(
      result.total
    ))).to.equal(collateral3Amount * 2);
    expect(Number(
      result.usersNumber
    )).to.equal(2);

    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1S2Balance - collateral1Amount, 4));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1BlBalance + collateral1Amount, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2S2Balance - collateral2Amount, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(collateralContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2BlBalance + collateral2Amount, 4));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(signers[2].address)
    ));
    expect(roundTo(result, 2)).to.equal(roundTo(collateral3S2Balance - collateral3Amount, 2));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(collateralContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral3BlBalance + collateral3Amount, 4));

    await collateralContract.connect(signers[2])
      .withdrawCollateral(
        1, ethers.utils.parseUnits(
          collateralWithdraw.toString()
        )
      );
    await collateralContract.connect(signers[2])
      .withdrawCollateral(
        2, ethers.utils.parseUnits(
          collateralWithdraw.toString()
        )
      );
    await collateralContract.connect(signers[2])
      .withdrawCollateral(
        3, ethers.utils.parseUnits(
          collateralWithdraw.toString()
        )
      );

    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1S2Balance - collateral1Amount + collateralWithdraw, 4));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1BlBalance + collateral1Amount - collateralWithdraw, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2S2Balance - collateral2Amount + collateralWithdraw, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(collateralContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2BlBalance + collateral2Amount - collateralWithdraw, 4));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(signers[2].address)
    ));
    expect(roundTo(result, 2)).to.equal(roundTo(collateral3S2Balance - collateral3Amount + collateralWithdraw, 2));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(collateralContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral3BlBalance + collateral3Amount - collateralWithdraw, 4));

    await collateralContract.connect(signers[2])
      .withdrawCollateralAvailable(1);
    await collateralContract.connect(signers[2])
      .withdrawCollateralAvailable(2);
    await collateralContract.connect(signers[2])
      .withdrawCollateralAvailable(3);

    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1S2Balance, 4));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral1BlBalance, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[2].address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2S2Balance, 4));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(collateralContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral2BlBalance, 4));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(signers[2].address)
    ));
    expect(roundTo(result, 2)).to.equal(roundTo(collateral3S2Balance, 2));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(collateralContract.address)
    ));
    expect(roundTo(result, 4)).to.equal(roundTo(collateral3BlBalance, 4));

    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString(), 6), false);
    await blContract.connect(signers[1])
      .borrow(2, ethers.utils.parseUnits(borrowing2Amount.toString()), true);

    result = await blContract.getBorrowingProfile(1);
    expect(Number(ethers.utils.formatUnits(
      result.totalBorrowed, 6
    ))).to.equal(borrowing1Amount);
    expect(Number(ethers.utils.formatUnits(
      result.totalLent, 6
    ))).to.equal(lendingAmount);

    result = await blContract.getBorrowingProfile(2);
    expect(Number(ethers.utils.formatUnits(
      result.totalBorrowed
    ))).to.equal(borrowing2Amount);
    expect(Number(ethers.utils.formatUnits(
      result.totalLent
    ))).to.equal(lendingAmount);

    result = Number(ethers.utils.formatUnits(await signers[1].getBalance()));
    expect(roundTo(result, 1)).to.equal(roundTo(ethS1Balance - collateral3Amount, 1));
    result = Number(
      ethers.utils.formatUnits(await collateralContract.provider.getBalance(collateralContract.address))
    );
    expect(result).to.equal(collateral3Amount);

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

    result = Number(
      ethers.utils.formatUnits(await collateralContract.getAvailableCollateralAmount(signers[1].address, 1))
    );
    expect(roundTo(result, 4)).to.equal(collateral1ExpectedAvailableAmount);
    result = Number(
      ethers.utils.formatUnits(await collateralContract.getAvailableCollateralAmount(signers[1].address, 2))
    );
    expect(roundTo(result, 4)).to.equal(collateral2ExpectedAvailableAmount);
    result = Number(
      ethers.utils.formatUnits(await collateralContract.getAvailableCollateralAmount(signers[1].address, 3))
    );
    expect(roundTo(result, 4)).to.equal(collateral3ExpectedAvailableAmount);
    result = Number(
      ethers.utils.formatUnits(await blContract.getAvailableBorrowingUsdAmount(signers[1].address, 1))
    );
    expect(roundTo(result, 4)).to.equal(collateralsExtraCapacity);
    result = Number(
      ethers.utils.formatUnits(await blContract.getAvailableBorrowingAmount(signers[1].address, 2))
    );
    expect(roundTo(result, 4)).to.equal(collateralsExtraCapacity);
    const borrowing1Apr = Number(await blContract.getBorrowingApr(1)) / 10000;
    result = await blContract.getBorrowingMarketIndex(2);
    const borrowing2Apr = Number(result.fixedApr) / 10000;

    await hre.timeAndMine.increaseTime('100 days');

    await collateralContract.connect(signers[10])
      .adminWithdraw(zeroAddress, ethers.utils.parseUnits('1'));
    result = Number(ethers.utils.formatUnits(
      await collateralContract.getAdminWithdraw(zeroAddress)
    ));
    expect(result).to.equal(1);
    result = Number(
      ethers.utils.formatUnits(await collateralContract.provider.getBalance(collateralContract.address))
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
    result = Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingAmount(signers[1].address, 1), 6
    ));
    expect(roundTo(result, 4)).to
      .equal(roundTo(collateralsExtraCapacity - borrowing1ExpectedFee - borrowing2ExpectedFee, 4));
    result = Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingAmount(signers[1].address, 2)
    ));
    expect(roundTo(result, 4)).to
      .equal(roundTo(collateralsExtraCapacity - borrowing1ExpectedFee - borrowing2ExpectedFee, 4));
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

    result = await collateralContract.getCollateralProfile(1);
    const collateral1UsdRate = collateral1ProfileUsdRate;
    const collateral1BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateralLiquidationFactor = Number(
      await collateralContract.getLiquidationFactor()
    ) / 10000;
    const collateral1BorrowingCapacity = collateral1Amount * collateral1UsdRate
      * collateral1BorrowingFactor;
    result = await collateralContract.getCollateralProfile(2);
    const collateral2UsdRate = collateral2ProfileUsdRate;
    const collateral2BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateral2BorrowingCapacity = collateral2Amount * collateral2UsdRate
      * collateral2BorrowingFactor;
    result = await collateralContract.getCollateralProfile(3);
    const collateral3UsdRate = collateral3ProfileUsdRate;
    const collateral3BorrowingFactor = Number(result.borrowingFactor) / 10000;
    const collateral3BorrowingCapacity = collateral3Amount * collateral3UsdRate
      * collateral3BorrowingFactor;

    await collateralContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString(), 6), false);

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.be.lessThan(4);
    const collateral1MarginRate = borrowing1Amount
      * (1 + collateralLiquidationFactor) / collateral1Amount;
    const collateral1PreMarginRate = collateral1MarginRate * 1.1;
    const marginBorrowing1Amount = collateral1PreMarginRate * collateral1Amount
      / ((1 + collateralLiquidationFactor));
    const borrowing1Apr = Number(await blContract.getBorrowingApr(1));
    const preMarginPeriodInDays = Math.floor(
      (marginBorrowing1Amount - borrowing1Amount) * 365 * 10000
      / (borrowing1Apr * borrowing1Amount)
    );

    await proxyContract.connect(signers[10]).setUsdRateData(
      erc20CollateralContract.address,
      zeroAddress,
      zeroAddress,
      ethers.utils.parseUnits((collateral1MarginRate + 1).toString()),
      0,
      18,
      18,
      18,
      false
    );
    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.be.lessThan(4);

    await proxyContract.connect(signers[10]).setUsdRateData(
      erc20CollateralContract.address,
      zeroAddress,
      zeroAddress,
      ethers.utils.parseUnits(collateral1MarginRate.toString()),
      0,
      18,
      18,
      18,
      false
    );
    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(4);

    await proxyContract.connect(signers[10]).setUsdRateData(
      erc20CollateralContract.address,
      zeroAddress,
      zeroAddress,
      ethers.utils.parseUnits(collateral1PreMarginRate.toString()),
      0,
      18,
      18,
      18,
      false
    );
    await hre.timeAndMine.increaseTime(`${preMarginPeriodInDays} days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.be.lessThan(4);

    await hre.timeAndMine.increaseTime(`1 days`);

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });
    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(4);


    result = await collateralContract.isLiquidator(signers[8].address);
    expect(result).to.be.false;
    await collateralContract.connect(signers[10]).addToLiquidators(signers[8].address);
    result = await collateralContract.isLiquidator(signers[8].address);
    expect(result).to.be.true;

    result = await collateralContract.getUsersCollateralIndex(signers[1].address, 1);
    expect(Number(result)).to.equal(1);
    result = await blContract.getUsersBorrowingIndex(signers[1].address, 1);
    expect(Number(result)).to.equal(1);

    await expect(
      collateralContract.connect(signers[7]).liquidate(signers[1].address)
    ).to.be.revertedWith('78');

    const collateral1LiquidatorBalance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[8].address)
    ));
    const collateral1LiquidationManagerBalance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[7].address)
    ));
    const collateral1BlBalance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    result = await collateralContract.getLiquidationData();
    const liquidationFee = Number(ethers.utils.formatUnits(
      result.liquidationFee, 4
    ));
    const liquidatorPercentage = Number(ethers.utils.formatUnits(
      result.liquidatorPercentage, 4
    ));

    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });
    const borrowingFeeAfterLiquidation = Number(ethers.utils.formatUnits(
      await blContract.getBorrowingFee(1, true), 6
    ));

    await collateralContract.connect(signers[8]).liquidate(signers[1].address);

    result = await blContract.getBorrowingProfile(1);
    expect(roundTo(Number(ethers.utils.formatUnits(
      result.totalLiquidated, 6
    )), 4)).to.equal(roundTo(borrowing1Amount + borrowingFeeAfterLiquidation, 4));

    result = await collateralContract.getCollateral(1);
    expect(result.liquidated).to.be.true;
    const collateral1AfterLiquidationAmount = Number(ethers.utils.formatUnits(result.amount));
    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.true;
    const borrowing1AfterLiquidationAmount = Number(ethers.utils.formatUnits(
      result.amount, 6
      ))
      + borrowingFeeAfterLiquidation;

    result = await collateralContract.getCollateral(2);
    expect(result.liquidated).to.be.false;
    const collateral1Remains = Number(ethers.utils.formatUnits(result.amount));
    const collateral2AfterLiquidationAmount = Number(ethers.utils.formatUnits(result.amount));
    const expectedCollateralTaken = borrowing1AfterLiquidationAmount * (1 + liquidationFee)
      / collateral1PreMarginRate;
    expect(roundTo(expectedCollateralTaken, 3)).to.equal(roundTo(
      collateral1AfterLiquidationAmount - collateral2AfterLiquidationAmount, 3
    ));
    const expectedCollateralSentToLiquidator = expectedCollateralTaken * liquidatorPercentage;
    const expectedCollateralSentToLiquidationManager = expectedCollateralTaken - expectedCollateralSentToLiquidator;

    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[7].address)
    ));
    expect(roundTo(result, 3)).to.equal(roundTo(
      collateral1LiquidationManagerBalance + expectedCollateralSentToLiquidationManager, 3
    ));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[8].address)
    ));
    expect(roundTo(result, 3)).to.equal(roundTo(
      collateral1LiquidatorBalance + expectedCollateralSentToLiquidator, 3
    ));
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    expect(roundTo(result, 3)).to.equal(roundTo(
      collateral1BlBalance - expectedCollateralTaken, 3
    ));

    result = await collateralContract.getUsersCollateralIndex(signers[1].address, 1);
    expect(Number(result)).to.equal(2);
    result = await blContract.getUsersBorrowingIndex(signers[1].address, 1);
    expect(Number(result)).to.equal(0);

    await expect(
      collateralContract.connect(signers[8]).liquidate(signers[1].address)
    ).to.be.revertedWith('59');

    result = await collateralContract.getAvailableCollateralAmount(signers[1].address, 1);
    expect(roundTo(
      Number(ethers.utils.formatUnits(result)), 4
    )).to.be.equal(roundTo(collateral1Remains, 4));
    result = Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingUsdAmount(signers[1].address, 1)
    ));
    const borrowing1AfterLiquidation = Math.floor(result);
    const borrowing1AfterLiquidationRemains = result - borrowing1AfterLiquidation;
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1AfterLiquidation.toString(), 6), false);

    result = Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingUsdAmount(signers[1].address, 1)
    ));
    expect(roundTo(result, 4)).to.be.equal(roundTo(borrowing1AfterLiquidationRemains, 4));
  });

  it("Flag removing (return borrowing)", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 500;
    const collateral1Amount = 5000;

    await collateralContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));
    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString(), 6), false);

    await hre.timeAndMine.increaseTime('100 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    let borrowedUsdAmountS1 = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address), 18
    ));

    result = await collateralContract.getCollateralProfile(1);
    const collateral1UsdRate = collateral1ProfileUsdRate;
    const collateralLiquidationFactor = Number(
      await collateralContract.getLiquidationFactor()
    ) / 10000;
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(1), 18
    ));
    result = await collateralContract.getLiquidationData();
    const liquidationRMax = Number(ethers.utils.formatUnits(result.liquidationRMax, 4));
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateralLiquidationFactor);
    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmountS1;

    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits((marginBorrowingUsdRate * 0.9).toString(), 30),
      false
    );

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.be.lessThan(4);
    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits(marginBorrowingUsdRate.toString(), 30),
      false
    );

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(4);

    borrowedUsdAmountS1 = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address), 18
    ));
    const toBeReturnedBorrowingUsdAmount = borrowedUsdAmountS1 * (
      1 + collateralLiquidationFactor
    ) * (
      1 + liquidationRMax
    ) - collateral1UsdAmount;
    const toBeReturnedBorrowingAmount = toBeReturnedBorrowingUsdAmount / marginBorrowingUsdRate;
    const minRepayment = Number(ethers.utils.formatUnits(
      await collateralContract.getMinimalUsdRepayment(signers[1].address)
    ));
    expect(roundTo(toBeReturnedBorrowingUsdAmount, 6))
      .to.equal(roundTo(minRepayment, 6));

    await blContract.connect(signers[1]).returnBorrowing(
      1, ethers.utils.parseUnits((toBeReturnedBorrowingAmount).toFixed(6), 6), false
    );
    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(Number(result)).to.equal(1);
  });

  it("Flag removing (add collateral)", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 5;
    const collateral1Amount = 50;

    await collateralContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));

    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString(), 6), false);

    await hre.timeAndMine.increaseTime('100 days');

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const borrowedUsdAmount1 = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address), 18
    ));

    result = await collateralContract.getCollateralProfile(1);
    const collateral1UsdRate = collateral1ProfileUsdRate;
    const collateralLiquidationFactor = Number(
      await collateralContract.getLiquidationFactor()
    ) / 10000;
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(1), 18
    ));
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateralLiquidationFactor);
    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount1;

    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits(marginBorrowingUsdRate.toString(), 30),
      false
    );

    expect(Number(
      await collateralContract.getLoanHealth(signers[1].address)
    )).to.equal(4);

    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits((marginBorrowingUsdRate * 1.3).toString(), 30),
      false
    );
    expect(Number(
      await collateralContract.getLoanHealth(signers[1].address)
    )).to.equal(4);

    const borrowedUsdAmount3 = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));

    const shouldBeCollateralUsdAmount = borrowedUsdAmount3 * (
      1 + collateralLiquidationFactor
    );

    const toBeAddedCollateralUsdAmount = shouldBeCollateralUsdAmount - collateral1UsdAmount;
    const toBeAddedCollateralAmount = roundTo(
      toBeAddedCollateralUsdAmount / collateral1UsdRate, 10
    );

    await collateralContract.connect(signers[1]).depositCollateral(
      1, ethers.utils.parseUnits((toBeAddedCollateralAmount * 0.99).toFixed(10))
    );

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(4);

    await collateralContract.connect(signers[1]).depositCollateral(
      1, ethers.utils.parseUnits(shouldBeCollateralUsdAmount.toFixed(10))
    );
    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(1);
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

    await collateralContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await collateralContract.connect(signers[10])
      .addToLiquidators(signers[8].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );
    await collateralContract.connect(signers[2])
      .depositCollateral(1, ethers.utils.parseUnits(collateral4Amount.toString()));
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString(), 6), false);
    await blContract.connect(signers[1])
      .borrow(2, ethers.utils.parseUnits(borrowing2Amount.toString()), true);
    await blContract.connect(signers[2])
      .borrow(1, ethers.utils.parseUnits(borrowing3Amount.toString(), 6), false);

    await hre.timeAndMine.increaseTime('100 days');

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    result = await collateralContract.getCollateralProfile(1);
    const collateral1UsdRate = collateral1ProfileUsdRate;
    const collateralLiquidationFactor = Number(
      await collateralContract.getLiquidationFactor()
    ) / 10000;
    result = await collateralContract.getCollateralProfile(2);
    const collateral2UsdRate = collateral2ProfileUsdRate;
    result = await collateralContract.getCollateralProfile(3);
    const collateral3UsdRate = collateral3ProfileUsdRate;

    result = await collateralContract.getLiquidationData();
    const liquidationFee = Number(ethers.utils.formatUnits(
      result.liquidationFee, 4
    ));
    const liquidatorPercentage = Number(ethers.utils.formatUnits(
      result.liquidatorPercentage, 4
    ));

    const borrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(1)
    ));
    const collateral2UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(2)
    ));
    const collateral3UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(3)
    ));
    const depositedCollateralUsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getUserCollateralUsdAmount(signers[1].address, false)
    ));
    expect(
      collateral1UsdAmount + collateral2UsdAmount + collateral3UsdAmount
    ).to.equal(depositedCollateralUsdAmount);
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateralLiquidationFactor)
      + collateral2UsdAmount / (1 + collateralLiquidationFactor)
      + collateral3UsdAmount / (1 + collateralLiquidationFactor);

    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount;
    result = Number(await collateralContract.getLoanHealth(signers[2].address));
    expect(result).to.be.lessThan(4);

    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits(Math.floor(marginBorrowingUsdRate).toString(), 30),
      false
    );
    await blContract.connect(signers[9]).setUsdRateData(
      borrowing2Contract.address,
      ethers.utils.parseUnits(Math.floor(marginBorrowingUsdRate).toString()),
      false
    );

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.be.lessThan(4);

    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits(Math.ceil(marginBorrowingUsdRate).toString(), 30),
      false
    );
    await blContract.connect(signers[9]).setUsdRateData(
      borrowing2Contract.address,
      ethers.utils.parseUnits(Math.ceil(marginBorrowingUsdRate).toString()),
      false
    );

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(4);

    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const newBorrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const expectedWithdrawnCollateralUsdAmount = newBorrowedUsdAmount * (1 + liquidationFee);
    const expectedCollateralUsdRemains = (depositedCollateralUsdAmount - expectedWithdrawnCollateralUsdAmount);
    const borrowing1Fee = Number(ethers.utils.formatUnits(
      await blContract.getBorrowingFee(1, true), 6
    ));

    await collateralContract.connect(signers[8]).liquidate(signers[1].address);

    result = await blContract.getBorrowingProfile(1);
    expect(roundTo(Number(ethers.utils.formatUnits(
      result.totalLiquidated, 6
    )), 4)).to.equal(roundTo(
      borrowing1Amount + borrowing1Fee, 4
    ));

    result = await collateralContract.getCollateral(1);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(2);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(3);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(4);
    result = await collateralContract.getCollateral(5);
    expect(Number(result.prevCollateral)).to.equal(2);
    expect(result.liquidated).to.be.false;
    expect(roundTo(
      Number(ethers.utils.formatUnits(result.amount)), 2
    )).to.equal(roundTo(expectedCollateralUsdRemains / collateral2UsdRate, 2));
    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowing(2);
    expect(result.liquidated).to.be.true;

    result = Number(await collateralContract.getLoanHealth(signers[2].address));
    expect(result).to.equal(4);

    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const newBorrowed4Amount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[2].address)
    )) / Math.ceil(marginBorrowingUsdRate);

    await collateralContract.connect(signers[8]).liquidate(signers[2].address);

    result = await blContract.getBorrowingProfile(1);
    const totalLiquidated = Number(ethers.utils.formatUnits(
      result.totalLiquidated, 6
    ));
    expect(roundTo(totalLiquidated, 3)).to.equal(roundTo(
      borrowing1Amount + borrowing1Fee + newBorrowed4Amount, 3
    ));
    expect(Number(result.totalReturned)).to.equal(0);

    const returnedAmount = 100;
    await blContract.connect(signers[7]).returnLiquidatedBorrowing(
      1, ethers.utils.parseUnits(returnedAmount.toString(), 6)
    );
    result = await blContract.getBorrowingProfile(1);
    expect(roundTo(Number(ethers.utils.formatUnits(
      result.totalReturned, 6
    )), 4)).to.equal(roundTo(returnedAmount, 4));
    expect(Number(ethers.utils.formatUnits(
      result.totalLiquidated, 6
    ))).to.equal(totalLiquidated);
  });

  it("Combined borrowing with liquidation, erc20 last", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 500;
    const borrowing2Amount = 500;
    const collateral1Amount = 9900;
    const collateral2Amount = 100;
    const collateral3Amount = 10;

    await collateralContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await collateralContract.connect(signers[10])
      .addToLiquidators(signers[8].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString(), 6), false);
    await blContract.connect(signers[1])
      .borrow(2, ethers.utils.parseUnits(borrowing2Amount.toString()), true);

    await hre.timeAndMine.increaseTime('100 days');

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    result = await collateralContract.getCollateralProfile(1);
    const collateral1UsdRate = collateral1ProfileUsdRate;
    const collateralLiquidationFactor = Number(
      await collateralContract.getLiquidationFactor()
    ) / 10000;

    result = await collateralContract.getCollateralProfile(2);
    const collateral2UsdRate = collateral2ProfileUsdRate;
    result = await collateralContract.getCollateralProfile(3);
    const collateral3UsdRate = collateral3ProfileUsdRate;

    result = await collateralContract.getLiquidationData();
    const liquidationFee = Number(ethers.utils.formatUnits(
      result.liquidationFee, 4
    ));
    const liquidatorPercentage = Number(ethers.utils.formatUnits(
      result.liquidatorPercentage, 4
    ));

    const borrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(1)
    ));
    const collateral2UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(2)
    ));
    const collateral3UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(3)
    ));
    const depositedCollateralUsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getUserCollateralUsdAmount(signers[1].address, false)
    ));
    expect(
      collateral1UsdAmount + collateral2UsdAmount + collateral3UsdAmount
    ).to.equal(depositedCollateralUsdAmount);
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateralLiquidationFactor)
      + collateral2UsdAmount / (1 + collateralLiquidationFactor)
      + collateral3UsdAmount / (1 + collateralLiquidationFactor);

    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount;

    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits(Math.floor(marginBorrowingUsdRate).toString(), 30),
      false
    );
    await blContract.connect(signers[9]).setUsdRateData(
      borrowing2Contract.address,
      ethers.utils.parseUnits(Math.floor(marginBorrowingUsdRate).toString()),
      false
    );

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.be.lessThan(4);

    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits(Math.ceil(marginBorrowingUsdRate).toString(), 30),
      false
    );
    await blContract.connect(signers[9]).setUsdRateData(
      borrowing2Contract.address,
      ethers.utils.parseUnits(Math.ceil(marginBorrowingUsdRate).toString()),
      false
    );

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(4);

    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const newBorrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const expectedWithdrawnCollateralUsdAmount = newBorrowedUsdAmount * (1 + liquidationFee);
    const expectedCollateralUsdRemains = (depositedCollateralUsdAmount - expectedWithdrawnCollateralUsdAmount);

    await collateralContract.connect(signers[8]).liquidate(signers[1].address);

    result = await collateralContract.getCollateral(1);
    expect(result.liquidated).to.be.true;

    result = await collateralContract.getCollateral(2);
    expect(result.liquidated).to.be.false;
    result = await collateralContract.getCollateral(3);
    expect(result.liquidated).to.be.true;

    result = await collateralContract.getCollateral(4);
    expect(Number(result.prevCollateral)).to.equal(1);
    expect(result.liquidated).to.be.false;

    expect(roundTo(
      Number(ethers.utils.formatUnits(result.amount)), 3
    )).to.equal(roundTo(
      (expectedCollateralUsdRemains - collateral2UsdAmount) / collateral1UsdRate, 3)
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

    await collateralContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await collateralContract.connect(signers[10])
      .addToLiquidators(signers[8].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString(), 6));
    await collateralContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString(), 6), false);
    await blContract.connect(signers[1])
      .borrow(2, ethers.utils.parseUnits(borrowing2Amount.toString()), true);

    await hre.timeAndMine.increaseTime('100 days');

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    result = await collateralContract.getCollateralProfile(1);
    const collateral1UsdRate = collateral1ProfileUsdRate;
    const collateralLiquidationFactor = Number(
      await collateralContract.getLiquidationFactor()
    ) / 10000;
    result = await collateralContract.getCollateralProfile(2);
    const collateral2UsdRate = collateral2ProfileUsdRate;
    result = await collateralContract.getCollateralProfile(3);
    const collateral3UsdRate = collateral3ProfileUsdRate;

    result = await collateralContract.getLiquidationData();
    const liquidationFee = Number(ethers.utils.formatUnits(
      result.liquidationFee, 4
    ));
    const liquidatorPercentage = Number(ethers.utils.formatUnits(
      result.liquidatorPercentage, 4
    ));

    const borrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(1)
    ));
    const collateral2UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(2)
    ));
    const collateral3UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(3)
    ));
    const depositedCollateralUsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getUserCollateralUsdAmount(signers[1].address, false)
    ));
    expect(
      collateral1UsdAmount + collateral2UsdAmount + collateral3UsdAmount
    ).to.equal(depositedCollateralUsdAmount);
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateralLiquidationFactor)
      + collateral2UsdAmount / (1 + collateralLiquidationFactor)
      + collateral3UsdAmount / (1 + collateralLiquidationFactor);

    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount;

    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits(Math.floor(marginBorrowingUsdRate).toString(), 30),
      false
    );
    await blContract.connect(signers[9]).setUsdRateData(
      borrowing2Contract.address,
      ethers.utils.parseUnits(Math.floor(marginBorrowingUsdRate).toString()),
      false
    );

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.be.lessThan(4);

    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits(Math.ceil(marginBorrowingUsdRate).toString(), 30),
      false
    );
    await blContract.connect(signers[9]).setUsdRateData(
      borrowing2Contract.address,
      ethers.utils.parseUnits(Math.ceil(marginBorrowingUsdRate).toString()),
      false
    );

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(4);

    const collateral1BlBalance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    const collateral1S8Balance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[8].address)
    ));
    const collateral1S7Balance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[7].address)
    ));

    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const newBorrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const expectedWithdrawnCollateralUsdAmount = newBorrowedUsdAmount * (1 + liquidationFee);
    const expectedCollateralUsdRemains = (depositedCollateralUsdAmount - expectedWithdrawnCollateralUsdAmount);

    await collateralContract.connect(signers[8]).liquidate(signers[1].address);

    result = await collateralContract.getCollateral(1);
    expect(result.liquidated).to.be.false;
    result = await collateralContract.getCollateral(2);
    expect(result.liquidated).to.be.false;
    result = await collateralContract.getCollateral(3);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(4);
    expect(Number(result.prevCollateral)).to.equal(3);
    expect(result.liquidated).to.be.false;
    expect(roundTo(
      Number(ethers.utils.formatUnits(result.amount)), 3
    )).to.equal(roundTo(
      (
          expectedCollateralUsdRemains - collateral1UsdAmount - collateral2UsdAmount
      ) / collateral3UsdRate, 3
    ));
    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowing(2);
    expect(result.liquidated).to.be.true;
  });

  it("Combined borrowing with liquidation, mtb last", async function () {
    const lendingAmount = 8000;
    const borrowing1Amount = 50;
    const borrowing2Amount = 50;
    const borrowing3Amount = 50;
    const collateral1Amount = 500;
    const collateral2Amount = 500;
    const collateral3Amount = 1;
    const collateral4Amount = 5000;
    const collateral5Amount = 35000;
    const collateralProfileLiquidationFactor = 1500;

    await collateralContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await collateralContract.connect(signers[10])
      .addToLiquidators(signers[8].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(5, ethers.utils.parseUnits(collateral5Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );
    await collateralContract.connect(signers[2])
      .depositCollateral(1, ethers.utils.parseUnits(collateral4Amount.toString()));
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString(), 6), false);
    await blContract.connect(signers[1])
      .borrow(2, ethers.utils.parseUnits(borrowing2Amount.toString()), true);
    await blContract.connect(signers[2])
      .borrow(1, ethers.utils.parseUnits(borrowing3Amount.toString(), 6), false);

    await hre.timeAndMine.increaseTime('100 days');

    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    result = await collateralContract.getCollateralProfile(1);
    const collateralProfile1UsdRate = collateral1ProfileUsdRate;
    const collateralProfile1LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await collateralContract.getCollateralProfile(2);
    const collateralProfile2UsdRate = collateral2ProfileUsdRate;
    const collateralProfile2LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await collateralContract.getCollateralProfile(3);
    const collateralProfile3UsdRate = collateral3ProfileUsdRate;
    const collateralProfile3LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await collateralContract.getCollateralProfile(4);
    const collateralProfile4UsdRate = collateral2ProfileUsdRate;
    const collateralProfile4LiquidationFactor = Number(result.liquidationFactor) / 10000;
    result = await collateralContract.getCollateralProfile(5);
    const collateralProfile5UsdRate = collateral5ProfileUsdRate;
    const collateralProfile5LiquidationFactor = Number(result.liquidationFactor) / 10000;

    result = await collateralContract.getLiquidationData();
    const liquidationFee = Number(ethers.utils.formatUnits(
      result.liquidationFee, 4
    ));
    const liquidatorPercentage = Number(ethers.utils.formatUnits(
      result.liquidatorPercentage, 4
    ));

    const borrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(1)
    ));
    const collateral2UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(2)
    ));
    const collateral3UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(3)
    ));
    const collateral4UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(4)
    ));
    const depositedCollateralUsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getUserCollateralUsdAmount(signers[1].address, false)
    ));
    expect(
      collateral1UsdAmount + collateral2UsdAmount + collateral3UsdAmount + collateral4UsdAmount
    ).to.equal(depositedCollateralUsdAmount);

    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateralProfileLiquidationFactor / 10000)
      + collateral2UsdAmount / (1 + collateralProfileLiquidationFactor / 10000)
      + collateral3UsdAmount / (1 + collateralProfileLiquidationFactor / 10000)
      + collateral4UsdAmount / (1 + collateralProfileLiquidationFactor / 10000);

    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount;
    result = Number(await collateralContract.getLoanHealth(signers[2].address));
    expect(result).to.equal(1);

    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits(
        (marginBorrowingUsdRate * 0.99).toFixed(10), 30
      ),
      false
    );
    await blContract.connect(signers[9]).setUsdRateData(
      borrowing2Contract.address,
      ethers.utils.parseUnits((marginBorrowingUsdRate * 0.99).toFixed(10)),
      false
    );
    result = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(3);

    await blContract.connect(signers[9]).setUsdRateData(
      borrowing1Contract.address,
      ethers.utils.parseUnits(
        (marginBorrowingUsdRate * 1.01).toFixed(10), 30
      ),
      false
    );
    await blContract.connect(signers[9]).setUsdRateData(
      borrowing2Contract.address,
      ethers.utils.parseUnits((marginBorrowingUsdRate * 1.01).toFixed(10)),
      false
    );
    result = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(4);

    await hre.timeAndMine.increaseTime(`1 days`);
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    const newBorrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const expectedWithdrawnCollateralUsdAmount = newBorrowedUsdAmount * (1 + liquidationFee);
    const expectedCollateralUsdRemains = (depositedCollateralUsdAmount - expectedWithdrawnCollateralUsdAmount);
    const borrowing1Fee = Number(ethers.utils.formatUnits(
      await blContract.getBorrowingFee(1, true), 6
    ));

    await collateralContract.connect(signers[8]).liquidate(signers[1].address);

    result = await blContract.getBorrowingProfile(1);
    expect(roundTo(Number(ethers.utils.formatUnits(
      result.totalLiquidated, 6
    )), 4)).to.equal(roundTo(
      borrowing1Amount + borrowing1Fee, 4
    ));

    result = await collateralContract.getCollateral(1);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(2);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(3);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(4);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(6);
    expect(Number(result.prevCollateral)).to.equal(3);
    expect(result.liquidated).to.be.false;
    expect(roundTo(
      Number(ethers.utils.formatUnits(result.amount)), 1
    )).to.equal(roundTo(expectedCollateralUsdRemains / collateral5ProfileUsdRate, 1));
    result = await blContract.getBorrowing(1);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowing(2);
    expect(result.liquidated).to.be.true;

    result = Number(await collateralContract.getLoanHealth(signers[2].address));
    expect(result).to.equal(1);
  });

  it("NFT collateral", async function () {
    result = await collateralContract.getCollateral(1);
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

    result = await collateralContract.getCollateral(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.collateralProfileIndex)).to.equal(4);
    expect(Number(ethers.utils.formatUnits(
      result.amount
    ))).to.equal(nft1Price + nft2Price);
    expect(result.liquidated).to.be.false;

    result = await nftCollateralContract.getUserTokensNumber(signers[0].address);
    expect(Number(result)).to.equal(2);

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(collateralContract.address)
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

    result = await collateralContract.getCollateral(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.collateralProfileIndex)).to.equal(4);
    expect(Number(ethers.utils.formatUnits(
      result.amount
    ))).to.equal(nft1Price + nft2Price + nft3Price);
    expect(result.liquidated).to.be.false;

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(collateralContract.address)
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
      await nEtnaContract.balanceOf(collateralContract.address)
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
    result = await collateralContract.getCollateral(3);
    expect(result.userAddress).to.equal(signers[2].address);
    expect(Number(result.collateralProfileIndex)).to.equal(4);
    expect(Number(ethers.utils.formatUnits(
      result.amount
    ))).to.equal(tokensValue);
    expect(result.liquidated).to.be.false;

    const nEtnaBalance = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(collateralContract.address)
    ));
    expect(nEtnaBalance).to.equal(
      tokensValue + nft1Price + nft2Price + nft3Price + nft4Price + nft5Price + nft6Price
    );

    await nftCollateralContract.connect(signers[0])
      .withdrawNftCollateral([1,2,4]);

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(collateralContract.address)
    ));
    expect(result).to.equal(
      nEtnaBalance - nft1Price - nft2Price
    );

    result = await collateralContract.getCollateral(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.collateralProfileIndex)).to.equal(4);
    expect(Number(ethers.utils.formatUnits(
      result.amount
    ))).to.equal(nft3Price);
    expect(result.liquidated).to.be.false;

    let toBorrowS1 = Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingUsdAmount(signers[1].address, 1)
    ));

    await blContract.connect(signers[0]).lend(
      1, ethers.utils.parseUnits(toBorrowS1.toString(), 6)
    );

    toBorrowS1 /= 3;

    await blContract.connect(signers[1]).borrow(
      1, ethers.utils.parseUnits(toBorrowS1.toString(), 6), false
    );

    await expect(
      nftCollateralContract.connect(signers[1])
      .withdrawNftCollateral([4,5,6])
    ).to.be.revertedWith('30');

    await nftCollateralContract.connect(signers[1])
      .withdrawNftCollateral([4]);

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(collateralContract.address)
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
      await nEtnaContract.balanceOf(collateralContract.address)
    ));
    expect(result).to.equal(
      nEtnaBalance - nft1Price - nft2Price - nft4Price - tokensValue
    );
    expect(result).to.equal(
      nft3Price + nft5Price + nft6Price + lastTokenPrice
    );

    await blContract.connect(signers[1]).returnBorrowing(
      1, ethers.utils.parseUnits(toBorrowS1.toString(), 6), false
    );
    await nftCollateralContract.connect(signers[1])
      .withdrawNftCollateral([5,6]);

    result = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(collateralContract.address)
    ));
    expect(result).to.equal(
      nft3Price + lastTokenPrice
    );

    result = await collateralContract.getCollateral(3);
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
        1, ethers.utils.parseUnits(initialEtnaTransfer.toString(), 6)
      );

    await blContract.connect(signers[0])
      .borrowAvailable(1, false);
    await blContract.connect(signers[1])
      .borrowAvailable(1, false);
    await blContract.connect(signers[2])
      .borrowAvailable(1, false);

    await blContract.connect(signers[9])
      .setUsdRateData(
        borrowing1Contract.address,
        ethers.utils.parseUnits('10', 30),
        false
      );

    result = Number(await collateralContract.getLoanHealth(signers[0].address));
    expect(result).to.equal(4);
    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(4);
    result = Number(await collateralContract.getLoanHealth(signers[2].address));
    expect(result).to.equal(4);

    await collateralContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await collateralContract.connect(signers[10])
      .addToLiquidators(signers[8].address);

    hre.timeAndMine.increaseTime('1 day');

    await collateralContract.connect(signers[8])
      .liquidate(signers[0].address);
    await collateralContract.connect(signers[8])
      .liquidate(signers[1].address);
    await collateralContract.connect(signers[8])
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

    await collateralContract.connect(signers[10])
      .setLiquidationManager(signers[7].address);
    await collateralContract.connect(signers[10])
      .addToLiquidators(signers[8].address);
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmount.toString(), 6));
    await blContract.connect(signers[0])
      .lend(2, ethers.utils.parseUnits(lendingAmount.toString()));

    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral1Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(2, ethers.utils.parseUnits(collateral2Amount.toString()));
    await collateralContract.connect(signers[1])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral3Amount.toString()),
        { value: ethers.utils.parseUnits(collateral3Amount.toString()) }
      );

    await nftCollateralContract.connect(signers[1])
      .depositNftCollateral([4,5,6]);
    await nftCollateralContract.connect(signers[0])
      .depositNftCollateral([1,2,3]);

    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits(borrowing1Amount.toString(), 6), false);

    await blContract.connect(signers[1])
      .borrowAvailable(2, true);

    await hre.timeAndMine.increaseTime('100 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    result = await collateralContract.getCollateralProfile(1);
    const collateral1UsdRate = collateral1ProfileUsdRate;
    const collateralLiquidationFactor = Number(
      await collateralContract.getLiquidationFactor()
    ) / 10000;
    result = await collateralContract.getCollateralProfile(2);
    const collateral2UsdRate = collateral2ProfileUsdRate;
    result = await collateralContract.getCollateralProfile(3);
    const collateral3UsdRate = collateral3ProfileUsdRate;
    result = await collateralContract.getCollateralProfile(4);
    const collateral4UsdRate = collateral4ProfileUsdRate;

    result = await collateralContract.getLiquidationData();
    const liquidationFee = Number(ethers.utils.formatUnits(
      result.liquidationFee, 4
    ));
    const liquidatorPercentage = Number(ethers.utils.formatUnits(
      result.liquidatorPercentage, 4
    ));

    const borrowedUsdAmount = Number(ethers.utils.formatUnits(
      await blContract.getBorrowedUsdAmount(signers[1].address)
    ));
    const collateral1UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(1)
    ));
    const collateral2UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(2)
    ));
    const collateral3UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(3)
    ));
    const collateral4UsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getCollateralUsdAmount(4)
    ));

    const depositedCollateralUsdAmount = Number(ethers.utils.formatUnits(
      await collateralContract.getUserCollateralUsdAmount(signers[1].address, false)
    ));
    expect(
      collateral1UsdAmount + collateral2UsdAmount + collateral3UsdAmount + collateral4UsdAmount
    ).to.equal(depositedCollateralUsdAmount);
    const marginBorrowingUsdAmount =
      collateral1UsdAmount / (1 + collateralLiquidationFactor)
      + collateral2UsdAmount / (1 + collateralLiquidationFactor)
      + collateral3UsdAmount / (1 + collateralLiquidationFactor)
      + collateral4UsdAmount / (1 + collateralLiquidationFactor);

    const marginBorrowingUsdRate = marginBorrowingUsdAmount / borrowedUsdAmount;

    await blContract.connect(signers[9])
      .setUsdRateData(
        borrowing1Contract.address,
        ethers.utils.parseUnits(Math.floor(marginBorrowingUsdRate).toString(), 30),
        false
      );
    await blContract.connect(signers[9])
      .setUsdRateData(
        borrowing2Contract.address,
        ethers.utils.parseUnits(Math.floor(marginBorrowingUsdRate).toString()),
        false
      );

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.be.lessThan(4);

    await blContract.connect(signers[9])
      .setUsdRateData(
        borrowing1Contract.address,
        ethers.utils.parseUnits(Math.ceil(marginBorrowingUsdRate).toString(), 30),
        false
      );
    await blContract.connect(signers[9])
      .setUsdRateData(
        borrowing2Contract.address,
        ethers.utils.parseUnits(Math.ceil(marginBorrowingUsdRate).toString()),
        false
      );

    result = Number(await collateralContract.getLoanHealth(signers[1].address));
    expect(result).to.equal(4);

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
      await blContract.getBorrowingFee(1, true), 6
    ));

    const collateral1S7BalanceBefore = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[7].address)
    ));
    const collateral1S8BalanceBefore = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[8].address)
    ));
    const collateral1BlBalanceBefore = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    const collateral2S7BalanceBefore = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[7].address)
    ));
    const collateral2S8BalanceBefore = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[8].address)
    ));
    const collateral2BlBalanceBefore = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(collateralContract.address)
    ));
    const collateral3S7BalanceBefore = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(signers[7].address)
    ));
    const collateral3S8BalanceBefore = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(signers[8].address)
    ));
    const collateral3BlBalanceBefore = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(collateralContract.address)
    ));
    const collateral4S7BalanceBefore = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(signers[7].address)
    ));
    const collateral4S8BalanceBefore = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(signers[8].address)
    ));
    const collateral4BlBalanceBefore = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(collateralContract.address)
    ));

    await collateralContract.connect(signers[8]).liquidate(signers[1].address);
    result = await blContract.getBorrowingProfile(1);
    expect(roundTo(Number(ethers.utils.formatUnits(
      result.totalLiquidated, 6
    )), 4)).to.equal(roundTo(
      borrowing1Amount + borrowing1Fee, 4
    ));

    const collateral1S7BalanceAfter = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[7].address)
    ));
    const collateral1S8BalanceAfter = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[8].address)
    ));
    const collateral1BlBalanceAfter = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    const collateral2S7BalanceAfter = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[7].address)
    ));
    const collateral2S8BalanceAfter = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[8].address)
    ));
    const collateral2BlBalanceAfter = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(collateralContract.address)
    ));
    const collateral3S7BalanceAfter = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(signers[7].address)
    ));
    const collateral3S8BalanceAfter = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(signers[8].address)
    ));
    const collateral3BlBalanceAfter = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(collateralContract.address)
    ));
    const collateral4S7BalanceAfter = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(signers[7].address)
    ));
    const collateral4S8BalanceAfter = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(signers[8].address)
    ));
    const collateral4BlBalanceAfter = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(collateralContract.address)
    ));

    result = await collateralContract.getCollateral(1);
    expect(result.liquidated).to.be.true;
    const collateral1LiquidatedAmount = Number(ethers.utils.formatUnits(result.amount));
    result = await collateralContract.getCollateral(2);
    expect(result.liquidated).to.be.true;
    const collateral2LiquidatedAmount = Number(ethers.utils.formatUnits(result.amount));
    result = await collateralContract.getCollateral(3);
    expect(result.liquidated).to.be.true;
    const collateral3LiquidatedAmount = Number(ethers.utils.formatUnits(result.amount));
    result = await collateralContract.getCollateral(4);
    expect(result.liquidated).to.be.true;
    let collateral4LiquidatedAmount = Number(ethers.utils.formatUnits(result.amount));
    result = await collateralContract.getCollateral(5);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(result.liquidated).to.be.false;
    result = await collateralContract.getCollateral(6);
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
    result = await collateralContract.isManager(signers[3].address);
    expect(result).to.be.false;

    await expect(
      blContract.connect(signers[0]).addToManagers(signers[3].address)
    )
      .to.be.revertedWith('62');
    await expect(
      collateralContract.connect(signers[0]).addToManagers(signers[3].address)
    )
      .to.be.revertedWith('62');

    await expect(
      blContract.connect(signers[3]).removeFromManagers(signers[4].address)
    )
      .to.be.revertedWith('62');
    await expect(
      collateralContract.connect(signers[3]).removeFromManagers(signers[4].address)
    )
      .to.be.revertedWith('62');

    await blContract.connect(signers[10]).addToManagers(signers[3].address);
    result = await blContract.isManager(signers[3].address);
    expect(result).to.be.true;
    await expect(
      blContract.connect(signers[3]).addToManagers(signers[0].address)
    )
      .to.be.revertedWith('62');

    await collateralContract.connect(signers[10]).addToManagers(signers[3].address);
    result = await collateralContract.isManager(signers[3].address);
    expect(result).to.be.true;
    await expect(
      collateralContract.connect(signers[3]).addToManagers(signers[0].address)
    )
      .to.be.revertedWith('62');

    await blContract.connect(signers[10]).removeFromManagers(signers[3].address);
    result = await blContract.isManager(signers[3].address);
    expect(result).to.be.false;
    await collateralContract.connect(signers[10]).removeFromManagers(signers[3].address);
    result = await collateralContract.isManager(signers[3].address);
    expect(result).to.be.false;

    result = await collateralContract.isLiquidator(signers[3].address);
    expect(result).to.be.false;
    await collateralContract.connect(signers[10]).addToLiquidators(signers[3].address);
    result = await collateralContract.isLiquidator(signers[3].address);
    expect(result).to.be.true;
    await expect(
      collateralContract.connect(signers[0]).addToLiquidators(signers[3].address)
    )
      .to.be.revertedWith('63');

    await expect(
      collateralContract.connect(signers[3]).removeFromLiquidators(signers[4].address)
    )
      .to.be.revertedWith('63');

    await collateralContract.connect(signers[10]).removeFromLiquidators(signers[3].address);
    result = await collateralContract.isLiquidator(signers[3].address);
    expect(result).to.be.false;

    result = await collateralContract.getLiquidationManager();
    expect(result).to.equal(signers[10].address);
    await expect(
      collateralContract.connect(signers[3]).setLiquidationManager(signers[9].address)
    )
      .to.be.revertedWith('63');

    await collateralContract.connect(signers[10]).setLiquidationManager(signers[9].address);
    result = await collateralContract.getLiquidationManager();
    expect(result).to.equal(signers[9].address);
    await expect(
      collateralContract.connect(signers[10]).setLiquidationManager(zeroAddress)
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

    result = await collateralContract.owner();
    expect(result).to.equal(signers[10].address);
    await collateralContract.connect(signers[10])
      .transferOwnership(signers[0].address);
    result = await collateralContract.owner();
    expect(result).to.equal(signers[0].address);
    await collateralContract.connect(signers[0])
      .transferOwnership(signers[10].address);
    result = await collateralContract.owner();
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
      .setMarketplaceContract(signers[0].address);
    result = await nftCollateralContract.getMarketplaceContract();
    expect(result).to.equal(signers[0].address);

    await nftCollateralContract.connect(signers[10])
      .setNftContract(signers[0].address);
    result = await nftCollateralContract.getNftContract();
    expect(result).to.equal(signers[0].address);
  });

  it("Manager settings", async function () {
    await blContract.connect(signers[10]).addToManagers(signers[9].address);
    await collateralContract.connect(signers[10]).addToManagers(signers[9].address);

    await blContract.connect(signers[9])
      .setUsdRateData(
        borrowing1Contract.address,
        2000,
        false
      );
    result = await blContract.getUsdRateData(
      borrowing1Contract.address,
    );
    expect(Number(result.rate)).to.equal(2000);
    await collateralContract.connect(signers[9])
      .setUsdRateData(
        borrowing1Contract.address,
        2000,
        false
      );
    result = await collateralContract.getUsdRateData(
      borrowing1Contract.address,
    );
    expect(Number(result.rate)).to.equal(2000);

    result = await collateralContract.getCollateralProfile(1);
    expect(collateral1ProfileUsdRate).to.equal(0.5);
    await expect(
      collateralContract.connect(signers[8]).setCollateralProfileData(
        1,
        22,
        false
      )
    ).to.be.revertedWith('63')

    await collateralContract.connect(signers[0]).depositCollateral(
      1, ethers.utils.parseUnits('1000')
    );
    result = await collateralContract.getCollateral(1);
    expect(result.liquidated).to.be.false;
    await expect(
      collateralContract.connect(signers[8]).setCollateralLiquidationStatus(1, true)
    ).to.be.revertedWith('63')
    await collateralContract.connect(signers[9]).setCollateralLiquidationStatus(1, true);
    result = await collateralContract.getCollateral(1);
    expect(result.liquidated).to.be.true;
    await collateralContract.connect(signers[9]).setCollateralLiquidationStatus(1, false);
    result = await collateralContract.getCollateral(1);
    expect(result.liquidated).to.be.false;

    await blContract.connect(signers[0]).lend(
      1, ethers.utils.parseUnits('100', 6)
    );
    await blContract.connect(signers[0]).borrow(
      1, ethers.utils.parseUnits('10', 6), false
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

    result = await collateralContract.getCollateralProfile(1);
    expect(result.active).to.be.true;
    await collateralContract.connect(signers[9]).setCollateralProfileData(
      1,
      22,
      false
    );
    result = await collateralContract.getCollateralProfile(1);
    expect(result.active).to.be.false;
    expect(Number(result.borrowingFactor)).to.equal(22);
    await collateralContract.connect(signers[9]).setCollateralProfileData(
      1,
      collateral1ProfileBorrowingFactor,
      true
    );
    result = await collateralContract.getCollateralProfile(1);
    expect(result.active).to.be.true;
    expect(Number(result.borrowingFactor)).to.equal(collateral1ProfileBorrowingFactor);

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

    await collateralContract.connect(signers[9]).setLiquidationData(
      444, 555, 666, 777
    );
    result = await collateralContract.getLiquidationData();
    expect(Number(result.liquidationFee)).to.equal(444);
    expect(Number(result.liquidatorPercentage)).to.equal(555);
    expect(Number(result.liquidationRMin)).to.equal(666);
    expect(Number(result.liquidationRMax)).to.equal(777);

    await expect(
      collateralContract.connect(signers[3]).setEtnaContract(signers[10].address)
    )
      .to.be.revertedWith('63');
    await collateralContract.connect(signers[9])
      .setEtnaContract(signers[10].address);
    result = await collateralContract.getEtnaContract();
    expect(result).to.equal(signers[10].address);
    await collateralContract.connect(signers[9])
      .setEtnaContract(etnaContract.address);
    result = await collateralContract.getEtnaContract();
    expect(result).to.equal(etnaContract.address);

    await expect(
      collateralContract.connect(signers[3]).setNEtnaContract(signers[10].address)
    )
      .to.be.revertedWith('63');
    await collateralContract.connect(signers[9])
      .setNEtnaContract(signers[10].address);
    result = await collateralContract.getNEtnaContract();
    expect(result).to.equal(signers[10].address);
    await collateralContract.connect(signers[9])
      .setNEtnaContract(etnaContract.address);
    result = await collateralContract.getNEtnaContract();
    expect(result).to.equal(etnaContract.address);

    await expect(
      nftCollateralContract.connect(signers[9])
        .setCollateralContract(signers[10].address)
    ).to.be.revertedWith('Caller is not the manager');
    await nftCollateralContract.connect(signers[10])
      .addToManagers(signers[9].address);
    await nftCollateralContract.connect(signers[9])
      .updateNEtnaContract();
    result = await nftCollateralContract.getNEtnaContract();
    expect(result).to.equal(etnaContract.address);
    await nftCollateralContract.connect(signers[9])
      .setCollateralContract(signers[10].address);
    result = await nftCollateralContract.getCollateralContract();
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
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    const collateral2BLBalance = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(collateralContract.address)
    ));
    const collateral3BLBalance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(collateralContract.address)
    ));
    const s1BLBalance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[10].address)
    ));
    const s2BLBalance = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[10].address)
    ));
    const s3BLBalance = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(signers[10].address)
    ));

    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits(collateral.toString()));
    await collateralContract.connect(signers[2])
      .depositCollateral(2, ethers.utils.parseUnits(collateral.toString()));
    await collateralContract.connect(signers[3])
      .depositCollateral(
        3, ethers.utils.parseUnits(collateral.toString()),
        {value: ethers.utils.parseUnits(collateral.toString())}
      );

    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    expect(result).to.equal(collateral1BLBalance + collateral);
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(collateralContract.address)
    ));
    expect(result).to.equal(collateral2BLBalance + collateral);
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(collateralContract.address)
    ));
    expect(result).to.equal(collateral3BLBalance + collateral);

    await expect(
      collateralContract.connect(signers[9])
        .adminWithdraw(
          erc20CollateralContract.address, ethers.utils.parseUnits(collateral.toString())
        )
    ).to.be.revertedWith('62');
    await expect(
      collateralContract.connect(signers[8])
        .adminWithdraw(
          etnaContract.address, ethers.utils.parseUnits(collateral.toString())
        )
    ).to.be.revertedWith('62');
    await expect(
      collateralContract.connect(signers[0])
        .adminWithdraw(zeroAddress, ethers.utils.parseUnits(collateral.toString()))
    ).to.be.revertedWith('62');

    await collateralContract.connect(signers[10])
      .adminWithdraw(
        etnaContract.address, ethers.utils.parseUnits(collateral.toString())
      );
    await collateralContract.connect(signers[10])
      .adminWithdraw(
        erc20CollateralContract.address, ethers.utils.parseUnits(collateral.toString())
      );
    await collateralContract.connect(signers[10])
      .adminWithdraw(zeroAddress, ethers.utils.parseUnits(collateral.toString()));

    result = Number(ethers.utils.formatUnits(
      await collateralContract.getAdminWithdraw(etnaContract.address)
    ));
    expect(result).to.equal(collateral);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.getAdminWithdraw(erc20CollateralContract.address)
    ));
    expect(result).to.equal(collateral);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.getAdminWithdraw(zeroAddress)
    ));
    expect(result).to.equal(collateral);
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    expect(result).to.equal(collateral1BLBalance);
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(collateralContract.address)
    ));
    expect(result).to.equal(collateral2BLBalance);
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(collateralContract.address)
    ));
    expect(result).to.equal(collateral3BLBalance);
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[10].address)
    ));
    expect(result).to.equal(s1BLBalance + collateral);
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[10].address)
    ));
    expect(result).to.equal(s2BLBalance + collateral);
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(signers[10].address)
    ));
    expect(roundTo(result, 1)).to.equal(roundTo(s3BLBalance + collateral, 1));

    const replenishAmount = 100;
    await collateralContract.connect(signers[10])
      .adminReplenish(
        etnaContract.address, ethers.utils.parseUnits(replenishAmount.toString())
      );
    await collateralContract.connect(signers[10])
      .adminReplenish(
        erc20CollateralContract.address, ethers.utils.parseUnits((replenishAmount + 10).toString())
      );
    await collateralContract.connect(signers[10])
      .adminReplenish(
        zeroAddress, 0
        , {value: ethers.utils.parseUnits((replenishAmount - 10).toString())}
      );
    result = Number(ethers.utils.formatUnits(
      await collateralContract.getAdminReplenish(etnaContract.address)
    ));
    expect(result).to.equal(replenishAmount);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.getAdminReplenish(erc20CollateralContract.address)
    ));
    expect(result).to.equal(replenishAmount + 10);
    result = Number(ethers.utils.formatUnits(
      await collateralContract.getAdminReplenish(zeroAddress)
    ));
    expect(result).to.equal(replenishAmount - 10);

    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(collateralContract.address)
    ));
    expect(result).to.equal(collateral1BLBalance + replenishAmount + 10);
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(collateralContract.address)
    ));
    expect(result).to.equal(collateral2BLBalance + replenishAmount);
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(collateralContract.address)
    ));
    expect(result).to.equal(collateral3BLBalance + replenishAmount - 10);
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.balanceOf(signers[10].address)
    ));
    expect(result).to.equal(s1BLBalance + collateral - (replenishAmount + 10));
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[10].address)
    ));
    expect(result).to.equal(s2BLBalance + collateral - replenishAmount);
    result = Number(ethers.utils.formatUnits(
      await erc20CollateralContract.provider.getBalance(signers[10].address)
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
      nftCollateralContract.address,
      ethers.utils.parseUnits((withdrawAmount * 2).toString(), 6)
    );
    const netnaBalanceContract = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(nftCollateralContract.address)
    ));
    const netnaBalanceS10 = Number(ethers.utils.formatUnits(
      await nEtnaContract.balanceOf(signers[10].address)
    ));
    const borrowing1BalanceContract = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(nftCollateralContract.address), 6
    ));
    const borrowing1BalanceS10 = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(signers[10].address), 6
    ));

    await nftCollateralContract.connect(signers[10])
      .adminWithdrawNEtna(
        ethers.utils.parseUnits(withdrawAmount.toString())
      );

    await nftCollateralContract.connect(signers[10])
      .adminWithdrawToken(
        borrowing1Contract.address, ethers.utils.parseUnits(
          withdrawAmount.toString(), 6
        )
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
      await borrowing1Contract.balanceOf(nftCollateralContract.address), 6
    ));
    expect(result).to.equal(borrowing1BalanceContract - withdrawAmount);
    result = Number(ethers.utils.formatUnits(
      await borrowing1Contract.balanceOf(signers[10].address), 6
    ));
    expect(result).to.equal(borrowing1BalanceS10 + withdrawAmount);
  });

  it("Borrowings migration", async function () {
    await blContract.connect(signers[10]).addToManagers(signers[9].address);

    await blContract.connect(signers[9])
      .migrateBorrowings(
        [
          signers[0].address,
          signers[1].address,
          signers[2].address,
          signers[3].address,
          signers[4].address,
          signers[5].address,
          signers[6].address,
          signers[7].address,
          signers[8].address,
          signers[9].address
        ],
        [
          1,1,1,1,1,2,2,2,2,2,
          1,2,3,4,5,6,7,8,9,0,
          0,9,8,7,6,5,4,3,2,1,
          0,0,0,0,0,1,2,3,4,5,
          1,1,1,1,1,0,0,0,0,0
        ]
      );
    result = await blContract.getBorrowing(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(1);
    expect(Number(result.accumulatedFee)).to.equal(0);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowingMarketIndex(1);
    expect(Number(result.fixedApr)).to.equal(0);
    result = await blContract.getBorrowing(2);
    expect(result.userAddress).to.equal(signers[1].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(2);
    expect(Number(result.accumulatedFee)).to.equal(9);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowingMarketIndex(2);
    expect(Number(result.fixedApr)).to.equal(0);
    result = await blContract.getBorrowing(3);
    expect(result.userAddress).to.equal(signers[2].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(3);
    expect(Number(result.accumulatedFee)).to.equal(8);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowingMarketIndex(3);
    expect(Number(result.fixedApr)).to.equal(0);
    result = await blContract.getBorrowing(4);
    expect(result.userAddress).to.equal(signers[3].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(4);
    expect(Number(result.accumulatedFee)).to.equal(7);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowingMarketIndex(4);
    expect(Number(result.fixedApr)).to.equal(0);
    result = await blContract.getBorrowing(5);
    expect(result.userAddress).to.equal(signers[4].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(5);
    expect(Number(result.accumulatedFee)).to.equal(6);
    expect(result.liquidated).to.be.true;
    result = await blContract.getBorrowingMarketIndex(5);
    expect(Number(result.fixedApr)).to.equal(0);
    result = await blContract.getBorrowing(6);
    expect(result.userAddress).to.equal(signers[5].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(6);
    expect(Number(result.accumulatedFee)).to.equal(5);
    expect(result.liquidated).to.be.false;
    result = await blContract.getBorrowingMarketIndex(6);
    expect(Number(result.fixedApr)).to.equal(1);
    result = await blContract.getBorrowing(7);
    expect(result.userAddress).to.equal(signers[6].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(7);
    expect(Number(result.accumulatedFee)).to.equal(4);
    expect(result.liquidated).to.be.false;
    result = await blContract.getBorrowingMarketIndex(7);
    expect(Number(result.fixedApr)).to.equal(2);
    result = await blContract.getBorrowing(8);
    expect(result.userAddress).to.equal(signers[7].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(8);
    expect(Number(result.accumulatedFee)).to.equal(3);
    expect(result.liquidated).to.be.false;
    result = await blContract.getBorrowingMarketIndex(8);
    expect(Number(result.fixedApr)).to.equal(3);
    result = await blContract.getBorrowing(9);
    expect(result.userAddress).to.equal(signers[8].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(9);
    expect(Number(result.accumulatedFee)).to.equal(2);
    expect(result.liquidated).to.be.false;
    result = await blContract.getBorrowingMarketIndex(9);
    expect(Number(result.fixedApr)).to.equal(4);
    result = await blContract.getBorrowing(10);
    expect(result.userAddress).to.equal(signers[9].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(0);
    expect(Number(result.accumulatedFee)).to.equal(1);
    expect(result.liquidated).to.be.false;
    result = await blContract.getBorrowingMarketIndex(10);
    expect(Number(result.fixedApr)).to.equal(5);
  });

  it("Lendings migration", async function () {
    await blContract.connect(signers[10]).addToManagers(signers[9].address);

    await blContract.connect(signers[9])
      .migrateLendings(
        [
          signers[0].address,
          signers[1].address,
          signers[2].address,
          signers[3].address,
          signers[4].address,
          signers[5].address,
          signers[6].address,
          signers[7].address,
          signers[8].address,
          signers[9].address
        ],
        [
          1,1,1,1,1,2,2,2,2,2,
          1,2,3,4,5,6,7,8,9,0,
          0,9,8,7,6,5,4,3,2,1,
          1,2,3,4,5,0,9,8,7,6
        ]
      );
    result = await blContract.getLending(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(1);
    expect(Number(result.accumulatedYield)).to.equal(0);
    expect(Number(result.unlock)).to.equal(1);
    result = await blContract.getLending(2);
    expect(result.userAddress).to.equal(signers[1].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(2);
    expect(Number(result.accumulatedYield)).to.equal(9);
    expect(Number(result.unlock)).to.equal(2);
    result = await blContract.getLending(3);
    expect(result.userAddress).to.equal(signers[2].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(3);
    expect(Number(result.accumulatedYield)).to.equal(8);
    expect(Number(result.unlock)).to.equal(3);
    result = await blContract.getLending(4);
    expect(result.userAddress).to.equal(signers[3].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(4);
    expect(Number(result.accumulatedYield)).to.equal(7);
    expect(Number(result.unlock)).to.equal(4);
    result = await blContract.getLending(5);
    expect(result.userAddress).to.equal(signers[4].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(5);
    expect(Number(result.accumulatedYield)).to.equal(6);
    expect(Number(result.unlock)).to.equal(5);
    result = await blContract.getLending(6);
    expect(result.userAddress).to.equal(signers[5].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(6);
    expect(Number(result.accumulatedYield)).to.equal(5);
    expect(Number(result.unlock)).to.equal(0);
    result = await blContract.getLending(7);
    expect(result.userAddress).to.equal(signers[6].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(7);
    expect(Number(result.accumulatedYield)).to.equal(4);
    expect(Number(result.unlock)).to.equal(9);
    result = await blContract.getLending(8);
    expect(result.userAddress).to.equal(signers[7].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(8);
    expect(Number(result.accumulatedYield)).to.equal(3);
    expect(Number(result.unlock)).to.equal(8);
    result = await blContract.getLending(9);
    expect(result.userAddress).to.equal(signers[8].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(9);
    expect(Number(result.accumulatedYield)).to.equal(2);
    expect(Number(result.unlock)).to.equal(7);
    result = await blContract.getLending(10);
    expect(result.userAddress).to.equal(signers[9].address);
    expect(Number(result.borrowingProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(0);
    expect(Number(result.accumulatedYield)).to.equal(1);
    expect(Number(result.unlock)).to.equal(6);
  });

  it("Collaterals migration", async function () {
    await collateralContract.connect(signers[10]).addToManagers(signers[9].address);

    await collateralContract.connect(signers[9])
      .migrateCollaterals(
        [
          signers[0].address,
          signers[1].address,
          signers[2].address,
          signers[3].address,
          signers[4].address,
          signers[5].address,
          signers[6].address,
          signers[7].address,
          signers[8].address,
          signers[9].address
        ],
        [
          1,1,1,1,1,2,2,2,2,2,
          1,2,3,4,5,6,7,8,9,0,
          0,0,0,0,0,1,2,3,4,5,
          1,1,1,1,1,0,0,0,0,0
        ]
      );
    result = await collateralContract.getCollateral(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.collateralProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(1);
    expect(Number(result.prevCollateral)).to.equal(0);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(2);
    expect(result.userAddress).to.equal(signers[1].address);
    expect(Number(result.collateralProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(2);
    expect(Number(result.prevCollateral)).to.equal(0);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(3);
    expect(result.userAddress).to.equal(signers[2].address);
    expect(Number(result.collateralProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(3);
    expect(Number(result.prevCollateral)).to.equal(0);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(4);
    expect(result.userAddress).to.equal(signers[3].address);
    expect(Number(result.collateralProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(4);
    expect(Number(result.prevCollateral)).to.equal(0);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(5);
    expect(result.userAddress).to.equal(signers[4].address);
    expect(Number(result.collateralProfileIndex)).to.equal(1);
    expect(Number(result.amount)).to.equal(5);
    expect(Number(result.prevCollateral)).to.equal(0);
    expect(result.liquidated).to.be.true;
    result = await collateralContract.getCollateral(6);
    expect(result.userAddress).to.equal(signers[5].address);
    expect(Number(result.collateralProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(6);
    expect(Number(result.prevCollateral)).to.equal(1);
    expect(result.liquidated).to.be.false;
    result = await collateralContract.getCollateral(7);
    expect(result.userAddress).to.equal(signers[6].address);
    expect(Number(result.collateralProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(7);
    expect(Number(result.prevCollateral)).to.equal(2);
    expect(result.liquidated).to.be.false;
    result = await collateralContract.getCollateral(8);
    expect(result.userAddress).to.equal(signers[7].address);
    expect(Number(result.collateralProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(8);
    expect(Number(result.prevCollateral)).to.equal(3);
    expect(result.liquidated).to.be.false;
    result = await collateralContract.getCollateral(9);
    expect(result.userAddress).to.equal(signers[8].address);
    expect(Number(result.collateralProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(9);
    expect(Number(result.prevCollateral)).to.equal(4);
    expect(result.liquidated).to.be.false;
    result = await collateralContract.getCollateral(10);
    expect(result.userAddress).to.equal(signers[9].address);
    expect(Number(result.collateralProfileIndex)).to.equal(2);
    expect(Number(result.amount)).to.equal(0);
    expect(Number(result.prevCollateral)).to.equal(5);
    expect(result.liquidated).to.be.false;
  });

  it("NftCollaterals migration", async function () {
    await nftCollateralContract.connect(signers[10]).addToManagers(signers[9].address);

    await nftCollateralContract.connect(signers[9])
      .migrateNftCollaterals(
        signers[0].address,
        [11,22,33,44,55],
        [10,20,30,40,50]
      );
    result = await nftCollateralContract.getDeposit(1);
    expect(result.userAddress).to.equal(signers[0].address);
    expect(Number(result.amount)).to.equal(150);
    expect(Number(result.tokensNumber)).to.equal(5);

    expect(Number(
      await nftCollateralContract.getUserTokenByIndex(
        signers[0].address, 1
      )
    )).to.equal(11);
    expect(Number(
      await nftCollateralContract.getUserTokenByIndex(
        signers[0].address, 2
      )
    )).to.equal(22);
    expect(Number(
      await nftCollateralContract.getUserTokenByIndex(
        signers[0].address, 3
      )
    )).to.equal(33);
    expect(Number(
      await nftCollateralContract.getUserTokenByIndex(
        signers[0].address, 4
      )
    )).to.equal(44);
    expect(Number(
      await nftCollateralContract.getUserTokenByIndex(
        signers[0].address, 5
      )
    )).to.equal(55);
    expect(Number(
      await nftCollateralContract.getLastTokenPrice(
        11
      )
    )).to.equal(10);
    expect(Number(
      await nftCollateralContract.getLastTokenPrice(
        22
      )
    )).to.equal(20);
    expect(Number(
      await nftCollateralContract.getLastTokenPrice(
        33
      )
    )).to.equal(30);
    expect(Number(
      await nftCollateralContract.getLastTokenPrice(
        44
      )
    )).to.equal(40);
    expect(Number(
      await nftCollateralContract.getLastTokenPrice(
        55
      )
    )).to.equal(50);
  });

  it("Lending bonus reward", async function () {
    const lendingAmounts = {
      0: {
          1: 922,
          2: 0,
        },
      1: {
          1: 154,
          2: 627,
        },
      2: {
          1: 0,
          2: 415,
        },
      3: {
          1: 43,
          2: 758,
        },
      4: {
          1: 2,
          2: 14,
        }
    };
    const rewards = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
    };
    const totalLent = {
      1: 0, 2: 0,
    };
    const balances = {
      0: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[0].address))),
      1: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[1].address))),
      2: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[2].address))),
      3: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[3].address))),
      4: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[4].address))),
    };
    const apr = {};
    let totalReward = 0;
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmounts[0][1].toString(), 6));
    await blContract.connect(signers[1])
      .lend(2, ethers.utils.parseUnits(lendingAmounts[1][2].toString()));

    expect(roundTo(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 1)).to.equal(0);
    expect(roundTo(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 1)).to.equal(0);

    await hre.timeAndMine.increaseTime('100 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    let toBeDistributed = rewardPool * 100 * 24 * 3600 / duration / 2;
    totalLent[1] += lendingAmounts[0][1];
    totalLent[2] += lendingAmounts[1][2];
    rewards[0] += toBeDistributed * lendingAmounts[0][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[0][1] / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[1][2] / totalLent[2];

    const rewardPerYear = rewardPool * 365 * 3600 * 24 / duration;
    const rewardUsdPerYear = rewardPerYear * collateral2ProfileUsdRate;
    apr[1] = rewardUsdPerYear / totalLent[1] * 100 / 2; // /2 - profile percentage
    result = Number(
      await rewardContract.getProfileApr(1)
    ) / 100;
    expect(roundTo(result, 1)).to.equal(roundTo(apr[1], 1));

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[0], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[1], 5));

    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmounts[0][1].toString(), 6));
    await blContract.connect(signers[1])
      .lend(1, ethers.utils.parseUnits(lendingAmounts[1][1].toString(), 6));
    await blContract.connect(signers[2])
      .lend(2, ethers.utils.parseUnits(lendingAmounts[2][2].toString()));
    await blContract.connect(signers[3])
      .lend(1, ethers.utils.parseUnits(lendingAmounts[3][1].toString(), 6));
    await blContract.connect(signers[3])
      .lend(2, ethers.utils.parseUnits(lendingAmounts[3][2].toString()));
    await blContract.connect(signers[4])
      .lend(1, ethers.utils.parseUnits(lendingAmounts[4][1].toString(), 6));
    await blContract.connect(signers[4])
      .lend(2, ethers.utils.parseUnits(lendingAmounts[4][2].toString()));

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[0], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[1], 5));

    await hre.timeAndMine.increaseTime('110 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    totalLent[1] += lendingAmounts[0][1] + lendingAmounts[1][1] + lendingAmounts[3][1] + lendingAmounts[4][1];
    totalLent[2] += lendingAmounts[2][2] + lendingAmounts[3][2] + lendingAmounts[4][2];
    toBeDistributed = rewardPool * 110 * 24 * 3600 / duration / 2;
    rewards[0] += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    totalReward += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[1][2] / totalLent[2];
    rewards[3] += toBeDistributed * lendingAmounts[3][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[3][1] / totalLent[1];
    rewards[4] += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    rewards[2] += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    rewards[3] += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    rewards[4] += toBeDistributed * lendingAmounts[4][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[4][2] / totalLent[2];

    apr[1] = rewardUsdPerYear
      / (totalLent[1])
      * 100 / 2; // /2 - profile percentage
    result = Number(
      await rewardContract.getProfileApr(1)
    ) / 100;
    expect(roundTo(result, 1)).to.equal(roundTo(apr[1], 1));
    apr[2] = rewardUsdPerYear
      / (totalLent[2])
      * 100 / 2; // /2 - profile percentage
    result = Number(
      await rewardContract.getProfileApr(2)
    ) / 100;
    expect(roundTo(result, 1)).to.equal(roundTo(apr[2], 1));

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[0], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[1], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[2].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[2], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[3].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[3], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[4].address, true)
    )), 5)).to.equal(
      roundToPrecision(rewards[4], 5)
    );
    await rewardContract.connect(signers[1]).withdrawReward();
    expect(roundTo(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(0);
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[1].address)
    )), 5)).to.equal(
      roundToPrecision(balances[1] + rewards[1], 5)
    );
    rewards[1] = 0;
    await rewardContract.connect(signers[3]).withdrawReward();
    expect(roundTo(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[3].address, true)
    )), 5)).to.equal(0);
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[3].address)
    )), 5)).to.equal(
      roundToPrecision(balances[3] + rewards[3], 5)
    );
    rewards[3] = 0;

    await hre.timeAndMine.increaseTime('90 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    toBeDistributed = rewardPool * 90 * 24 * 3600 / duration / 2;
    rewards[0] += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    totalReward += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    rewards[3] += toBeDistributed * lendingAmounts[3][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[3][1] / totalLent[1];
    rewards[4] += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[1][2] / totalLent[2];
    rewards[2] += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    rewards[3] += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    rewards[4] += toBeDistributed * lendingAmounts[4][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[4][2] / totalLent[2];

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[0], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[1], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[2].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[2], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[3].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[3], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[4].address, true)
    )), 5)).to.equal(
      roundToPrecision(rewards[4], 5)
    );

    await blContract.connect(signers[1])
      .withdrawLending(2, ethers.utils.parseUnits(lendingAmounts[1][2].toString()));
    await blContract.connect(signers[3])
      .withdrawLending(1, ethers.utils.parseUnits((lendingAmounts[3][1] / 2).toString(), 6));

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[0], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[1], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[2].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[2], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[3].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[3], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[4].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[4], 5));

    await hre.timeAndMine.increaseTime('200 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    totalLent[1] -= lendingAmounts[3][1] / 2;
    totalLent[2] -= lendingAmounts[1][2];
    toBeDistributed = rewardPool * 65 * 24 * 3600 / duration / 2;
    rewards[0] += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    totalReward += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    rewards[3] += toBeDistributed * lendingAmounts[3][1] / 2 / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[3][1] / 2 / totalLent[1];
    rewards[4] += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    rewards[2] += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    rewards[3] += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    rewards[4] += toBeDistributed * lendingAmounts[4][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[4][2] / totalLent[2];

    apr[1] = rewardUsdPerYear
      / (totalLent[1])
      * 100 / 2; // /2 - profile percentage
    result = Number(
      await rewardContract.getProfileApr(1)
    ) / 100;
    expect(roundTo(result, 1)).to.equal(roundTo(apr[1], 1));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 4)).to.equal(roundToPrecision(rewards[0], 4));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 4)).to.equal(roundToPrecision(rewards[1], 4));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[2].address, true)
    )), 4)).to.equal(roundToPrecision(rewards[2], 4));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[3].address, true)
    )), 4)).to.equal(roundToPrecision(rewards[3], 4));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[4].address, true)
    )), 4)).to.equal(roundToPrecision(rewards[4], 4));

    await rewardContract.connect(signers[0]).withdrawReward();
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    ));
    await rewardContract.connect(signers[1]).withdrawReward();
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    ));
    await rewardContract.connect(signers[2]).withdrawReward();
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    ));
    await rewardContract.connect(signers[3]).withdrawReward();
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    ));
    await rewardContract.connect(signers[4]).withdrawReward();
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    ));

    const newBalances = {
      0: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[0].address))),
      1: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[1].address))),
      2: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[2].address))),
      3: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[3].address))),
      4: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[4].address))),
    };
    const paidReward = (newBalances[0] - balances[0]) + (newBalances[1] - balances[1]) + (newBalances[2] - balances[2]) + (newBalances[3] - balances[3]) + (newBalances[4] - balances[4]);

    expect(roundTo(paidReward, 1))
      .to.equal(roundTo(totalReward, 1));
    expect(roundTo(Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    )), 1)).to.equal(0);
  });

  it("Bonus reward dynamic", async function () {
    const lendingAmounts = {
      0: {
        1: 922,
        2: 0,
      },
      1: {
        1: 154,
        2: 627,
      },
      2: {
        1: 0,
        2: 415,
      },
      3: {
        1: 43,
        2: 758,
      },
      4: {
        1: 2,
        2: 14,
      }
    };
    const rewards = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
    };
    const totalLent = {
      1: 0, 2: 0,
    };
    const balances = {
      0: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[0].address))),
      1: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[1].address))),
      2: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[2].address))),
      3: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[3].address))),
      4: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[4].address))),
    };
    const apr = {};
    let totalReward = 0;
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmounts[0][1].toString(), 6));
    await blContract.connect(signers[1])
      .lend(2, ethers.utils.parseUnits(lendingAmounts[1][2].toString()));

    expect(roundTo(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 1)).to.equal(0);
    expect(roundTo(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 1)).to.equal(0);

    await hre.timeAndMine.increaseTime('100 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    let toBeDistributed = rewardPool * 100 * 24 * 3600 / duration / 2;
    totalLent[1] += lendingAmounts[0][1];
    totalLent[2] += lendingAmounts[1][2];
    rewards[0] += toBeDistributed * lendingAmounts[0][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[0][1] / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[1][2] / totalLent[2];

    let rewardPerYear = rewardPool * 365 * 3600 * 24 / duration;
    let rewardUsdPerYear = rewardPerYear * collateral2ProfileUsdRate;
    apr[1] = rewardUsdPerYear / totalLent[1] * 100 / 2; // /2 - profile percentage
    result = Number(
      await rewardContract.getProfileApr(1)
    ) / 100;
    expect(roundTo(result, 1)).to.equal(roundTo(apr[1], 1));

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[0], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[1], 5));

    result = await rewardContract.getRewardData();
    const endTime = Number(result.endTime);

    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmounts[0][1].toString(), 6));
    await blContract.connect(signers[1])
      .lend(1, ethers.utils.parseUnits(lendingAmounts[1][1].toString(), 6));
    await blContract.connect(signers[2])
      .lend(2, ethers.utils.parseUnits(lendingAmounts[2][2].toString()));
    await blContract.connect(signers[3])
      .lend(1, ethers.utils.parseUnits(lendingAmounts[3][1].toString(), 6));
    await blContract.connect(signers[3])
      .lend(2, ethers.utils.parseUnits(lendingAmounts[3][2].toString()));
    await blContract.connect(signers[4])
      .lend(1, ethers.utils.parseUnits(lendingAmounts[4][1].toString(), 6));
    await blContract.connect(signers[4])
      .lend(2, ethers.utils.parseUnits(lendingAmounts[4][2].toString()));

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[0], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[1], 5));


    const already = rewards[0] + rewards[1] + rewards[2] + rewards[3] + rewards[4];
    rewardPool *= 2;
    rewardPerYear = rewardPool * 365 * 3600 * 24 / duration;
    rewardUsdPerYear = rewardPerYear * collateral2ProfileUsdRate;
    await etnaContract.connect(signers[10]).transfer(
      rewardContract.address, ethers.utils.parseUnits('100000')
    );
    await rewardContract.connect(signers[10]).
    setRewardData(
      duration,
      endTime,
      ethers.utils.parseUnits(rewardPool.toString())
    );
    result = await rewardContract.getRewardData();

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[0], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[1], 5));

    await hre.timeAndMine.increaseTime('110 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    totalLent[1] += lendingAmounts[0][1] + lendingAmounts[1][1] + lendingAmounts[3][1] + lendingAmounts[4][1];
    totalLent[2] += lendingAmounts[2][2] + lendingAmounts[3][2] + lendingAmounts[4][2];
    toBeDistributed = rewardPool * 110 * 24 * 3600 / duration / 2;
    rewards[0] += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    totalReward += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[1][2] / totalLent[2];
    rewards[3] += toBeDistributed * lendingAmounts[3][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[3][1] / totalLent[1];
    rewards[4] += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    rewards[2] += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    rewards[3] += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    rewards[4] += toBeDistributed * lendingAmounts[4][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[4][2] / totalLent[2];

    apr[1] = rewardUsdPerYear
      / (totalLent[1])
      * 100 / 2; // /2 - profile percentage
    result = Number(
      await rewardContract.getProfileApr(1)
    ) / 100;
    expect(roundTo(result, 1)).to.equal(roundTo(apr[1], 1));
    apr[2] = rewardUsdPerYear
      / (totalLent[2])
      * 100 / 2; // /2 - profile percentage
    result = Number(
      await rewardContract.getProfileApr(2)
    ) / 100;
    expect(roundTo(result, 1)).to.equal(roundTo(apr[2], 1));

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[0], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[1], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[2].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[2], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[3].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[3], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[4].address, true)
    )), 5)).to.equal(
      roundToPrecision(rewards[4], 5)
    );
    await rewardContract.connect(signers[1]).withdrawReward();
    expect(roundTo(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(0);
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[1].address)
    )), 5)).to.equal(
      roundToPrecision(balances[1] + rewards[1], 5)
    );
    rewards[1] = 0;
    await rewardContract.connect(signers[3]).withdrawReward();
    expect(roundTo(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[3].address, true)
    )), 5)).to.equal(0);
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(signers[3].address)
    )), 5)).to.equal(
      roundToPrecision(balances[3] + rewards[3], 5)
    );
    rewards[3] = 0;

    await hre.timeAndMine.increaseTime('90 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    toBeDistributed = rewardPool * 90 * 24 * 3600 / duration / 2;
    rewards[0] += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    totalReward += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    rewards[3] += toBeDistributed * lendingAmounts[3][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[3][1] / totalLent[1];
    rewards[4] += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[1][2] / totalLent[2];
    rewards[2] += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    rewards[3] += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    rewards[4] += toBeDistributed * lendingAmounts[4][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[4][2] / totalLent[2];

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[0], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[1], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[2].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[2], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[3].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[3], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[4].address, true)
    )), 5)).to.equal(
      roundToPrecision(rewards[4], 5)
    );

    await blContract.connect(signers[1])
      .withdrawLending(2, ethers.utils.parseUnits(lendingAmounts[1][2].toString()));
    await blContract.connect(signers[3])
      .withdrawLending(1, ethers.utils.parseUnits((lendingAmounts[3][1] / 2).toString(), 6));

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[0], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[1], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[2].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[2], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[3].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[3], 5));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[4].address, true)
    )), 5)).to.equal(roundToPrecision(rewards[4], 5));

    await hre.timeAndMine.increaseTime('200 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    totalLent[1] -= lendingAmounts[3][1] / 2;
    totalLent[2] -= lendingAmounts[1][2];
    toBeDistributed = rewardPool * 65 * 24 * 3600 / duration / 2;
    rewards[0] += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    totalReward += toBeDistributed * (2 * lendingAmounts[0][1]) / totalLent[1];
    rewards[1] += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[1][1] / totalLent[1];
    rewards[3] += toBeDistributed * lendingAmounts[3][1] / 2 / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[3][1] / 2 / totalLent[1];
    rewards[4] += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    totalReward += toBeDistributed * lendingAmounts[4][1] / totalLent[1];
    rewards[2] += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[2][2] / totalLent[2];
    rewards[3] += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[3][2] / totalLent[2];
    rewards[4] += toBeDistributed * lendingAmounts[4][2] / totalLent[2];
    totalReward += toBeDistributed * lendingAmounts[4][2] / totalLent[2];

    apr[1] = rewardUsdPerYear
      / (totalLent[1])
      * 100 / 2; // /2 - profile percentage
    result = Number(
      await rewardContract.getProfileApr(1)
    ) / 100;
    expect(roundTo(result, 1)).to.equal(roundTo(apr[1], 1));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 4)).to.equal(roundToPrecision(rewards[0], 4));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[1].address, true)
    )), 4)).to.equal(roundToPrecision(rewards[1], 4));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[2].address, true)
    )), 4)).to.equal(roundToPrecision(rewards[2], 4));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[3].address, true)
    )), 4)).to.equal(roundToPrecision(rewards[3], 4));
    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[4].address, true)
    )), 4)).to.equal(roundToPrecision(rewards[4], 4));

    await rewardContract.connect(signers[0]).withdrawReward();
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    ));
    await rewardContract.connect(signers[1]).withdrawReward();
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    ));
    await rewardContract.connect(signers[2]).withdrawReward();
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    ));
    await rewardContract.connect(signers[3]).withdrawReward();
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    ));
    await rewardContract.connect(signers[4]).withdrawReward();
    result = Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    ));

    const newBalances = {
      0: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[0].address))),
      1: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[1].address))),
      2: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[2].address))),
      3: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[3].address))),
      4: Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[4].address))),
    };
    const paidReward = (newBalances[0] - balances[0]) + (newBalances[1] - balances[1]) + (newBalances[2] - balances[2]) + (newBalances[3] - balances[3]) + (newBalances[4] - balances[4]);

    expect(roundTo(paidReward, 1))
      .to.equal(roundTo(totalReward, 1));
    expect(roundTo(Number(ethers.utils.formatUnits(
      await etnaContract.balanceOf(rewardContract.address)
    )), 1)).to.equal(roundTo(already, 1));
  });

  it("Bonus reward specific", async function () {
    const lendingAmountS0 = 1000;
    const lendingAmountS1 = 200;
    let rewardS0 = 0;
    let rewardS1 = 0;
    let totalLent = 0;
    let balanceS0 = Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[0].address)));
    let balanceS1 = Number(ethers.utils.formatUnits(await etnaContract.balanceOf(signers[1].address)));
    let apr = 0;
    let totalReward = 0;
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmountS0.toString(), 6));

    expect(roundTo(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 1)).to.equal(0);

    await hre.timeAndMine.increaseTime('100 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    let toBeDistributed = rewardPool * 100 * 24 * 3600 / duration / 2;
    totalLent += lendingAmountS0;

    rewardS0 += toBeDistributed * lendingAmountS0 / totalLent;

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewardS0, 5));

    await blContract.connect(signers[0])
      .withdrawLending(1, ethers.utils.parseUnits(lendingAmountS0.toString(), 6));

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewardS0, 5));

    await hre.timeAndMine.increaseTime('100 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewardS0, 5));

    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits(lendingAmountS0.toString(), 6));

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewardS0, 5));

    await hre.timeAndMine.increaseTime('100 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });

    expect(roundToPrecision(Number(ethers.utils.formatUnits(
      await rewardContract.calculateReward(signers[0].address, true)
    )), 5)).to.equal(roundToPrecision(rewardS0 * 2, 5));
  });

  it("Proxy testing", async function () {
    await lpContract.connect(signers[10])
      .setReserves(
        ethers.utils.parseUnits('100000'),
        ethers.utils.parseUnits('200000')
      );

    await proxyContract.connect(signers[10])
      .setUsdRateData(
        lpContract.address,
        zeroAddress,
        lpContract.address,
        0,
        0,
        18,
        18,
        18,
        false
      );
    expect(Number(ethers.utils.formatUnits(
      await proxyContract.getUsdRate(lpContract.address)
    ))).to.equal(0.5);

    await proxyContract.connect(signers[10])
      .setUsdRateData(
        lpContract.address,
        zeroAddress,
        lpContract.address,
        0,
        0,
        18,
        18,
        18,
        true
      );
    expect(Number(ethers.utils.formatUnits(
      await proxyContract.getUsdRate(lpContract.address)
    ))).to.equal(2);

    await proxyContract.connect(signers[10])
      .setUsdRateData(
        lpContract.address,
        zeroAddress,
        lpContract.address,
        0,
        1,
        18,
        18,
        18,
        false
      );
    expect(Number(ethers.utils.formatUnits(
      await proxyContract.getUsdRate(lpContract.address)
    ))).to.equal(0.1);


    await proxyContract.connect(signers[10])
      .setUsdRateData(
        lpContract.address,
        zeroAddress,
        lpContract.address,
        0,
        2,
        18,
        18,
        18,
        false
      );
    expect(Number(ethers.utils.formatUnits(
      await proxyContract.getUsdRate(lpContract.address)
    ))).to.equal(0.2);

    await proxyContract.connect(signers[10])
      .setUsdRateData(
        lpContract.address,
        zeroAddress,
        lpContract.address,
        0,
        1,
        18,
        18,
        18,
        true
      );
    expect(Number(ethers.utils.formatUnits(
      await proxyContract.getUsdRate(lpContract.address)
    ))).to.equal(0.4);

    await proxyContract.connect(signers[10])
      .setUsdRateData(
        lpContract.address,
        zeroAddress,
        lpContract.address,
        0,
        2,
        18,
        18,
        18,
        true
      );
    expect(Number(ethers.utils.formatUnits(
      await proxyContract.getUsdRate(lpContract.address)
    ))).to.equal(0.8);

    await lpContract.connect(signers[10])
      .setReserves(
        '19500765869985818914936',
        '1265582673'
      );
    result = await lpContract.getReserves();

    await proxyContract.connect(signers[10])
      .setUsdRateData(
        lpContract.address,
        zeroAddress,
        lpContract.address,
        0,
        0,
        18,
        18,
        6,
        true
      );
    expect(roundTo(Number(ethers.utils.formatUnits(
      await proxyContract.getUsdRate(lpContract.address)
    )), 4)).to.equal(0.0649);
  });

  it('APR settings changing', async function () {
    await blContract.connect(signers[0])
      .lend(1, ethers.utils.parseUnits('1000', 6));
    await collateralContract.connect(signers[1])
      .depositCollateral(1, ethers.utils.parseUnits('10000'));
    await blContract.connect(signers[1])
      .borrow(1, ethers.utils.parseUnits('100', 6), false);
    await hre.timeAndMine.increaseTime('100 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });
    const fee = {
      lending: Number(ethers.utils.formatUnits(
        await blContract.getLendingYield(1, true), 6
      )),
      borrowing: Number(ethers.utils.formatUnits(
        await blContract.getBorrowingFee(1, true), 6
      )),
    };

    await blContract.connect(signers[10])
      .setAprSettings(
        5000,
        7000,
        500,
        3000,
        5000
      );
    fee.lendingAfterChange = Number(ethers.utils.formatUnits(
      await blContract.getLendingYield(1, true), 6
    ));
    fee.borrowingAfterChange = Number(ethers.utils.formatUnits(
      await blContract.getBorrowingFee(1, true), 6
    ));
    await hre.timeAndMine.increaseTime('100 days');
    await signers[0].sendTransaction({
      to: signers[1].address,
      value: 0
    });
    fee.lendingNew = Number(ethers.utils.formatUnits(
      await blContract.getLendingYield(1, true), 6
    ));
    fee.borrowingNew = Number(ethers.utils.formatUnits(
      await blContract.getBorrowingFee(1, true), 6
    ));
    expect(roundTo(fee.lending, 4)).to.equal(roundTo(fee.lendingAfterChange, 4));
    expect(fee.lending * 2).to.lessThan(fee.lendingNew);
    expect(roundTo(fee.borrowing, 4)).to.equal(roundTo(fee.borrowingAfterChange, 4));
    expect(fee.borrowing * 2).to.lessThan(fee.borrowingNew);
  });

  it("Lending - borrowing using tokens with different decimals", async function () {
    const borrowingFactor = 0.2;
    const decimals = 10000;
    const lendingAmount = 10000;
    const collateralAmount = 10000;
    const borrowingAmount = 100;
    const borrowing1Decimals = 6;
    const borrowing3Decimals = 6;
    const collateral1Decimals = 18;
    const collateral2Decimals = 8;
    const collateralUsdRate = 0.5;
    const lpReserve = 1000000;
    await blContract.connect(signers[10])
      .addBorrowingProfile(borrowing3Contract.address);

    await blContract.connect(signers[10]).setUsdRateData(
      borrowing3Contract.address,
      ethers.utils.parseUnits('1', 18 + (18 - borrowing3Decimals)),
      false
    );

    await collateralContract.connect(signers[10]).addCollateralProfile(
      erc20Collateral2Contract.address,
      borrowingFactor * decimals,
      5,
      false
    );

    await collateralContract.connect(signers[9]).setUsdRateData(
      erc20Collateral2Contract.address,
      0,
      true
    );

    await proxyContract.connect(signers[10])
      .setUsdRateData(
        erc20CollateralContract.address,
        zeroAddress,
        lpContract.address,
        0,
        0,
        18,
        18,
        18,
        false
      );

    await proxyContract.connect(signers[10])
      .setUsdRateData(
        erc20Collateral2Contract.address,
        zeroAddress,
        lpContract.address,
        0,
        0,
        collateral2Decimals,
        18,
        18,
        false
      );

    await lpContract.connect(signers[10])
      .setReserves(
        ethers.utils.parseUnits((lpReserve * collateralUsdRate).toString()),
        ethers.utils.parseUnits(lpReserve.toString())
      );

    await blContract.connect(signers[0])
      .lend(3, ethers.utils.parseUnits(
        lendingAmount.toString(),
        borrowing3Decimals
      ));

    await collateralContract.connect(signers[0])
      .depositCollateral(6, ethers.utils.parseUnits(
        collateralAmount.toString(),
        collateral2Decimals
      ));

    const expecting = {};
    expecting.borrowingAvailable = collateralAmount * collateralUsdRate
      * borrowingFactor;

    expect(Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingUsdAmount(signers[0].address, 1)
    ))).to.equal(expecting.borrowingAvailable);

    expect(Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingUsdAmount(signers[0].address, 3)
    ))).to.equal(expecting.borrowingAvailable);

    expect(Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingAmount(signers[0].address, 1),
      borrowing1Decimals
    ))).to.equal(expecting.borrowingAvailable);
    expect(Number(ethers.utils.formatUnits(
      await blContract.getAvailableBorrowingAmount(signers[0].address, 3),
      borrowing3Decimals
    ))).to.equal(expecting.borrowingAvailable);

    await expect(
      blContract.connect(signers[0])
        .borrow(
          3,
          ethers.utils.parseUnits(
            (expecting.borrowingAvailable * 1.01).toString(),
            borrowing3Decimals
          ),
          false
        ),
    ).to.be.revertedWith('12');

    await blContract.connect(signers[0])
      .borrow(
        3,
        ethers.utils.parseUnits(
          expecting.borrowingAvailable.toString(),
          borrowing3Decimals
        ),
        false
      );
  });
});

function roundTo(a, b) {
  a = Number(a);
  b = Number(b);
  if (isNaN(a) || !(b > 0)) return null;
  b = 10 ** b;
  return Math.round(a * b) / b;
}

function roundToPrecision(a, b) {
  a = Number(a);
  b = Number(b);
  if (a === 0) return 0;
  if (isNaN(a) || !(b > 0)) return null;
  const log10 = Math.floor(Math.log10(a));
  const factor = 10 ** (log10 + 1);
  a /= factor;
  b = 10 ** b;
  return roundTo((Math.floor(a * b) / b) * factor, 10);
}
