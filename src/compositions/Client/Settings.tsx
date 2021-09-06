import { ethers } from 'ethers'
import Link from 'next/link'
import { useRouter } from 'next/router'
import querystring from 'querystring'
import { ReactNode, useEffect, useState, VFC } from 'react'
import { UNITS } from 'src/constants/misc'
import { useContractStore } from 'src/stores'
import { useSettingsStore } from 'src/stores/settings'
import styled from 'styled-components'
import { ctaStyle, ErrorMessage, OutputMini, Unit } from './components'

export const Settings: VFC = () => {
  const { replace } = useRouter()
  const { contractAddress, setContractAddress, setAbi } = useContractStore()
  const [abiJsonLabel, setAbiJsonLabel] = useState('')

  const [abiJsonUrl, setAbiJsonUrl] = useState('')
  const [abiErrorMessage, setAbiErrorMessage] = useState<any>()

  const [editingAddress, setEditingAddress] = useState('')
  const [addressErrorMessage, setAddressErrorMessage] = useState('')

  const updateContractAddress = (address: string) => {
    setAddressErrorMessage('')
    if (!ethers.utils.isAddress(address)) {
      setAddressErrorMessage('Invalid address.')
      setEditingAddress(address)
      return
    }
    setContractAddress(address)
    setEditingAddress('')
  }

  const updateAbi = (data: any, label: string) => {
    setAbiErrorMessage(undefined)
    try {
      const json = JSON.parse(data)
      if (Array.isArray(json)) {
        setAbi({ abi: json })
      } else {
        json.address && setContractAddress(json.address)
        json.abi && setAbi(json)
      }
      setAbiJsonLabel(label)
      setAbiJsonUrl('')
    } catch (e) {
      setAbiErrorMessage(e)
    }
  }

  const fetchAbi = async (url: string) =>
    fetch(url).then(
      (res) =>
        res.text().then((data) => {
          updateAbi(data, url)
          replace(`?abiUrl=${encodeURI(url)}`, undefined, { shallow: true })
        }),
      setAbiErrorMessage,
    )

  useEffect(() => {
    const { abiUrl, address } = querystring.parse(
      window.location.search.replace('?', ''),
    )
    const load = async () => {
      if (abiUrl && typeof abiUrl === 'string') await fetchAbi(abiUrl)
      if (address && typeof address === 'string') updateContractAddress(address)
    }
    load()
  }, [])

  return (
    <Layout>
      <h2>Settings</h2>
      <SettingsFormItem
        title="ABI"
        output={abiJsonLabel}
        errorMessage={JSON.stringify(abiErrorMessage?.message, null, 4) || ''}
      >
        <Control>
          <input
            value={abiJsonUrl}
            onChange={({ target: { value } }) => setAbiJsonUrl(value)}
            placeholder="ABI URL"
          />
          <button onClick={() => fetchAbi(abiJsonUrl)} disabled={!abiJsonUrl}>
            Load
          </button>
          or
          <label>
            Select File
            <input
              type="file"
              onChange={({ target: { files } }) => {
                if (!files?.length) return
                const file = files[0]
                file.text().then((data) => updateAbi(data, file.name))
              }}
              hidden
            />
          </label>
        </Control>
      </SettingsFormItem>
      <AddressForm
        title="Contarct Address"
        output={contractAddress || ''}
        errorMessage={addressErrorMessage}
      >
        <Control>
          <input
            value={editingAddress}
            onChange={({ target: { value } }) => setEditingAddress(value)}
          />
          <button
            onClick={() => updateContractAddress(editingAddress)}
            disabled={!ethers.utils.isAddress(editingAddress)}
          >
            Set
          </button>
        </Control>
      </AddressForm>
      <MiscForm />
    </Layout>
  )
}

const MiscForm = () => {
  const { settings, setSettings } = useSettingsStore()
  return (
    <MiscDiv>
      <div>
        <h4>Input Unit</h4>
        <select
          onChange={({ target: { value } }) =>
            setSettings({ unit: value as typeof UNITS[number]['value'] })
          }
          value={settings.unit}
        >
          {UNITS.map(({ value, label }) => (
            <option key={value} value={value} label={label}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h4>Gas Limit</h4>
        <div>
          <input
            value={settings.gasLimit}
            onChange={({ target: { value } }) =>
              setSettings({ gasLimit: value })
            }
          />
          <Unit>WEI</Unit>
        </div>
      </div>
    </MiscDiv>
  )
}

type SettingsFormItemProps = {
  title: string
  output: string
  errorMessage: string
  children: ReactNode
  className?: string
}
const SettingsFormItem: VFC<SettingsFormItemProps> = ({
  title,
  output,
  errorMessage,
  children,
  className,
}) => {
  return (
    <div className={className}>
      <h3>{title}</h3>
      {output && (
        <OutputMini>
          {output.startsWith('http') ? (
            <Link href={output}>{output}</Link>
          ) : (
            output
          )}
        </OutputMini>
      )}
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      {children}
    </div>
  )
}

const Layout = styled.div`
  input,
  select {
    border: 1px solid;
    padding: 4px 8px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`
const AddressForm = styled(SettingsFormItem)`
  input {
    display: block;
    width: 100%;
    padding: 4px 8px;
  }
  button {
    ${ctaStyle};
  }
`
const Control = styled.div`
  display: flex;
  align-items: center;
  margin: 12px -8px 0;
  > * {
    margin: 0 8px;
  }
  input {
    flex: 1;
  }
  label,
  button {
    ${ctaStyle};
  }
`

const MiscDiv = styled.div`
  display: flex;
  margin: 20px -20px;
  > div {
    margin: 0 20px;
    display: flex;
    flex-direction: column;
  }
  h4 {
    font-size: 20px;
  }
`
