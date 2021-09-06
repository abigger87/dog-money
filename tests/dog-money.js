const anchor = require('@project-serum/anchor');
const {
  TOKEN_PROGRAM_ID,
  getTokenAccount,
  createMint,
  createTokenAccount,
  mintToAccount
} = require("./utils");


describe('dog-money', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  let programSigner;

  it('Is initialized!', async () => {
    // ** Generate Public Key
    dataAccount = await anchor.web3.Keypair.generate();

    const program = anchor.workspace.DogMoney;

    // ** Create USDC mint
    usdcMint = await createMint(program.provider, program.provider.wallet.PublicKey);

    // ** Program Signer PDA (Program Derived Address) - signs transactions for the program
    const [_programSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [dataAccount.Keypair.keypair.publicKey.toBuffer()],
      program.programId
    );
    programSigner = _programSigner;

    // ** Associated account PDA - store user data
    const userData = await program.account.userData.associatedAddress.fetch(program.provider.wallet.PublicKey, usdcMint);

    // ** Create user USDC account
    userUsdc = await createTokenAccount(program.provider, usdcMint, program.provider.wallet.publicKey);
    await mintToAccount(program.provider, usdcMint, userUsdc, new anchor.BN(5 * 10 ** 6), program.provider.wallet.publicKey);
    
    programVault = await createTokenAccount(program.provider, usdcMint, program.programId);
    dogMoneyMint = await createMint(program.provider, programSigner);
    userDogMoney = await createTokenAccount(program.provider, dogMoneyMint, program.provider.wallet.publicKey);

    await program.rpc.initializeUser({
      Accounts: {
        programSigner,
        userData,
        authority: program.provider.wallet.PublicKey,
        usdcMint,
        userUsdc,
        programVault,
        dogMoneyMint,
        userDogMoney,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      },
    });
  });
});
