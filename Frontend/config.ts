import { http, createConfig } from 'wagmi'
import { sepolia, polygonAmoy, mainnet } from 'wagmi/chains'
import { injected, metaMask, safe, walletConnect } from 'wagmi/connectors'

const projectId = 'c6b56f46e0d8f3e131375de912f95279'

export const config = createConfig({
  chains: [sepolia, polygonAmoy, mainnet],
  connectors: [
    injected({ target: 'metaMask' }),
    injected(),
    metaMask({ dappMetadata: { name: 'Edusphere' } }),
    walletConnect({ projectId }),
    safe(),
  ],
  transports: {
    [sepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [mainnet.id]: http(),
  },
})