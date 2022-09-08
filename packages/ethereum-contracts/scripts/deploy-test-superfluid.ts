import hre, {ethers} from "hardhat";

export async function deploySuperfluid() {
    const admin = (await ethers.getSigners())[0];
    // Deploy TestGovernance. Needs initialization later.
    const TestGovernanceFactory = await ethers.getContractFactory(
        "TestGovernance"
    );
    const TestGovernance = await TestGovernanceFactory.deploy();
    await TestGovernance.deployed();

    // Deploy Superfluid
    const SuperfluidFactory = await ethers.getContractFactory("SuperfluidMock");
    const Superfluid = await SuperfluidFactory.deploy(true, false);
    await Superfluid.deployed();

    // Initialize Superfluid with Governance address
    await Superfluid.initialize(TestGovernance.address);

    // Initialize Governance
    await TestGovernance.initialize(
        Superfluid.address,
        admin.address,
        14400,
        1800,
        []
    );

    // Deploy ConstantFlowAgreementV1
    const CFAv1Factory = await ethers.getContractFactory(
        "ConstantFlowAgreementV1"
    );
    const ConstantFlowAgreementV1 = await CFAv1Factory.deploy(
        Superfluid.address
    );
    await ConstantFlowAgreementV1.deployed();
    // Register ConstantFlowAgreementV1 TestGovernance
    await TestGovernance.registerAgreementClass(
        Superfluid.address,
        ConstantFlowAgreementV1.address
    );

    const SlotsBitmapLibraryFactory = await ethers.getContractFactory(
        "SlotsBitmapLibrary"
    );
    const SlotsBitmapLibrary = await SlotsBitmapLibraryFactory.deploy();
    await SlotsBitmapLibrary.deployed();

    // Deploy InstantDistributionAgreementV1
    const IDAv1Factory = await ethers.getContractFactory(
        "InstantDistributionAgreementV1",
        {
            libraries: {
                SlotsBitmapLibrary: SlotsBitmapLibrary.address,
            },
        }
    );
    const InstantDistributionAgreementV1 = await IDAv1Factory.deploy(
        Superfluid.address
    );
    await InstantDistributionAgreementV1.deployed();

    // Register InstantDistributionAgreementV1 with Governance
    await TestGovernance.registerAgreementClass(
        Superfluid.address,
        InstantDistributionAgreementV1.address
    );

    // Deploy SuperTokenFactoryHelper
    const SuperTokenFactoryHelperFactory = await ethers.getContractFactory(
        "SuperTokenFactoryHelper"
    );
    const SuperTokenFactoryHelper =
        await SuperTokenFactoryHelperFactory.deploy();
    await SuperTokenFactoryHelper.deployed();

    // Deploy SuperTokenFactory
    const SuperTokenFactoryFactory = await ethers.getContractFactory(
        "SuperTokenFactory"
    );
    const SuperTokenFactory = await SuperTokenFactoryFactory.deploy(
        Superfluid.address,
        SuperTokenFactoryHelper.address
    );
    await SuperTokenFactory.deployed();

    // 'Update' code with Governance and register SuperTokenFactory with Superfluid
    await TestGovernance.updateContracts(
        Superfluid.address,
        ethers.constants.AddressZero,
        [],
        SuperTokenFactory.address
    );

    // Deploy Resolver
    const ResolverFactory = await ethers.getContractFactory("Resolver");
    const Resolver = await ResolverFactory.deploy();
    await Resolver.deployed();

    // Deploy SuperfluidLoader
    const SuperfluidLoaderFactory = await ethers.getContractFactory(
        "SuperfluidLoader"
    );
    const SuperfluidLoader = await SuperfluidLoaderFactory.deploy(
        Resolver.address
    );
    await SuperfluidLoader.deployed();

    // Register Governance with Resolver
    await Resolver.set("TestGovernance.test", TestGovernance.address);

    // Register Superfluid with Resolver
    await Resolver.set("Superfluid.test", Superfluid.address);

    // Register SuperfluidLoader with Resolver
    await Resolver.set("SuperfluidLoader-v1.test", SuperfluidLoader.address);

    const contractsData = {
        TestGovernance: TestGovernance.address,
        Superfluid: Superfluid.address,
        ConstantFlowAgreementV1: ConstantFlowAgreementV1.address,
        InstantDistributionAgreementV1: InstantDistributionAgreementV1.address,
        SuperTokenFactory: SuperTokenFactory.address,
        Resolver: Resolver.address,
        SuperfluidLoader: SuperfluidLoader.address,
    };

    const tenderlyArtifacts = Object.entries(contractsData).map((x) => ({
        name: x[0],
        address: x[1],
    }));

    await hre.tenderly.persistArtifacts(tenderlyArtifacts);
}

deploySuperfluid()
    .then(() => {})
    .catch((err) => {
        console.error(err);
    });
