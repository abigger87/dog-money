const anchor = require('@project-serum/anchor');
const assert = require('assert');
// const { assert } = require('chai');
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
      [usdcMint.toBuffer()],
      program.programId
    );
    programSigner = _programSigner;

    // ** Associated account PDA - store user data
    const userData = await program.account.userData.associatedAddress.fetch(
      program.provider.wallet.PublicKey,
      usdcMint
    );

    // ** Create user USDC account
    const amount = new anchor.BN(5 * 10 ** 6);
    userUsdc = await createTokenAccount(program.provider, usdcMint, program.provider.wallet.publicKey);
    await mintToAccount(program.provider, usdcMint, userUsdc, amount, program.provider.wallet.publicKey);

    programVault = await createTokenAccount(program.provider, usdcMint, program.programId);
    dogMoneyMint = await createMint(program.provider, programSigner);
    userDogMoney = await createTokenAccount(program.provider, dogMoneyMint, program.provider.wallet.publicKey);

    await program.rpc.initializeUser(amount, {
      Accounts: {
        programSigner,
        userData,
        authority: program.provider.wallet.PublicKey,
        usdcMint,
        userUsdc,
        programVault,
        dogMoneyMint,
        userDogMoney,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      },
    });

    // ** Assert we sent the money
    userUsdcData = await getTokenAccount(program.provider, userUsdc);
    assert.ok(userUsdcData.amount.eq(new anchor.BN(0)));

    userDogMoneyData = await getTokenAccount(program.provider, userDogMoney);
    assert.ok(userDogMoneyData.amount.eq(amount.mul(new anchor.BN(1000))));
  });
});
