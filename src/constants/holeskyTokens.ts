import { ChainId } from '@cryptoalgebra/integral-sdk'
import { ERC20Token } from '@pancakeswap/sdk'

export const holeskyTokens = {
  weth: new ERC20Token(
    ChainId.Holesky,
    '0x94373a4919b3240d86ea41593d5eba789fef3848',
    18,
    'WETH',
    'WETH',
  ),
  usdt: new ERC20Token(
    ChainId.Holesky,
    '0x7d98346b3b000c55904918e3d9e2fc3f94683b01',
    18,
    'USDT',
    'USDT',
  ),
  skate: new ERC20Token(
    ChainId.Holesky,
    '0x2331a24b97acf5eb35e7d627cdf8ebf07f20c305',
    18,
    'SKATE',
    'SKATEboard',
  ),
}
