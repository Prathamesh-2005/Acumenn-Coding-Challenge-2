import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { ProjectCategory, ProjectCategoryCopy } from 'shared/constants/projects';
import toast from 'shared/utils/toast';
import supabase  from 'config/supaBaseConfig'; // Ensure this is configured
import { Form, Breadcrumbs } from 'shared/components';

import { FormCont, FormHeading, FormElement, ActionButton } from './Styles';

const propTypes = {
  project: PropTypes.object.isRequired,
  fetchProject: PropTypes.func.isRequired,
};

const ProjectSettings = ({ project, fetchProject }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (values, form) => {
    setIsUpdating(true);

    const { error } = await supabase
      .from('project')
      .update({
        name: values.name,
        url: values.url,
        description: values.description,
        category: values.category,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', project.id);

    setIsUpdating(false);

    if (error) {
      Form.handleAPIError(error, form);
    } else {
      toast.success('Changes have been saved successfully.');
      await fetchProject(); // Refresh project info
    }
  };

  return (
    <Form
      initialValues={Form.initialValues(project, get => ({
        name: get('name'),
        url: get('url'),
        category: get('category'),
        description: get('description'),
      }))}
      validations={{
        name: [Form.is.required(), Form.is.maxLength(100)],
        url: Form.is.url(),
        category: Form.is.required(),
      }}
      onSubmit={handleSubmit}
    >
      <FormCont>
        <FormElement>
          <Breadcrumbs items={['Projects', project.name, 'Project Details']} />
          <FormHeading>Project Details</FormHeading>

          <Form.Field.Input name="name" label="Name" />
          <Form.Field.Input name="url" label="URL" />
          <Form.Field.TextEditor
            name="description"
            label="Description"
            tip="Describe the project in as much detail as you'd like."
          />
          <Form.Field.Select name="category" label="Project Category" options={categoryOptions} />

          <ActionButton type="submit" variant="primary" isWorking={isUpdating}>
            Save changes
          </ActionButton>
        </FormElement>
      </FormCont>
    </Form>
  );
};

const categoryOptions = Object.values(ProjectCategory).map(category => ({
  value: category,
  label: ProjectCategoryCopy[category],
}));

ProjectSettings.propTypes = propTypes;

export default ProjectSettings;
