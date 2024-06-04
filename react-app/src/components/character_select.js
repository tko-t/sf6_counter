import Select from 'react-select';

export const CharaSelecter = (props) => {
  const { onChange, list } = props
  const onChangeHandler = (event) => {
    onChange(event.value)
  }
  return (
    <Select options={list} onChange={ (e) => onChangeHandler(e) }/>
  )
}
