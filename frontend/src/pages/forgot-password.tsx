import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import React, { useState } from "react";
import { InputField } from "../components/InputField";
import { Layout } from "../components/Layout";
import { useForgotPasswordMutation } from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

export const ForgotPassword: React.FC<{}> = ({}) => {
  const [complete, setComplete] = useState(false);
  const [forgotPassword] = useForgotPasswordMutation();
  return (
    <Layout variant="small">
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values) => {
          await forgotPassword({variables: values});
          setComplete(true);
        }}
      >
        {({ isSubmitting }) =>
          complete ? (
            <Box color={"lightgreen"}>
              If an account exists for this email, a reset link has been sent.
            </Box>
          ) : (
            <Form>
              <InputField
                name="email"
                placeholder="email"
                label="Email"
                type="email"
              />
              <Button
                mt={4}
                type="submit"
                backgroundColor="teal"
                isLoading={isSubmitting}
                color="white"
              >
                reset password
              </Button>
            </Form>
          )
        }
      </Formik>
    </Layout>
  );
};

export default withApollo({ ssr: false })(ForgotPassword);
