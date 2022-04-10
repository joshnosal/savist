import { Box } from "@mui/material"
import InputContainer from "../../../components/input_container"
import InputBase from '../../../components/input_base'
import FormContainer from "../../../components/form_container"

export default function ChargeNameForm(props) {
  const { state, dispatch, sx, userToken, user } = props

  const handleBlur = (prop) => (e) => dispatch({ type: 'set', state: { focusedElement: null } })
  const handleFocus = (prop) => (e) => dispatch({ type: 'set', state: { focusedElement: prop } })
  const handleChange = (prop) => (e) => {
    let error = !e.target.value && {message: 'Required'}
    dispatch({ type: 'set', state: { [prop]: {value: e.target.value, error: error}, processing_error: null } })
  }

  return (
    <FormContainer>
      <InputContainer
        title='Charge Name'
        error={state.nickname.error}
        focused={state.focusedElement === 'nickname'}
        sx={sx}
      >
        <InputBase
          onChange={handleChange('nickname')}
          value={state.nickname.value}
          onFocus={handleFocus('nickname')}
          onBlur={handleBlur('nickname')}
        />
      </InputContainer>
    </FormContainer>
  )
}