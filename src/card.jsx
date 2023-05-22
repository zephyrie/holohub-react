import React, { useState } from 'react';
import { Transition } from '@headlessui/react';

const Card = ({ data }) => {
  const { application, readme } = data;
  const { name, language, authors, tags } = application;
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="flex max-w-xl flex-col items-start justify-between border-2 p-4 rounded-lg">
      <div className="flex flex-wrap items-center gap-x-4 text-xs">
        {tags.map((tag, index) => 
            <span key={index} className="relative z-10 rounded-md bg-blue-50 my-1 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {tag}
            </span>
        )}
        </div>
        <div className="group relative">
        <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
            <span className="absolute inset-0" />
            {name}
        </h3>
        <span>Language: {language}</span>
        <div className="relative flex items-center gap-x-4">
            <div className="leading-6">
                <p className="text-gray-900">
                    Authors: {authors.map((author) => author.name).join(', ')}
                </p>
            </div>
        </div>
        <p className="my-2 line-clamp-3 text-sm leading-6 text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mollis viverra porta. Donec accumsan ante turpis, sed euismod lorem semper a. In pharetra tortor interdum vestibulum semper. </p>
        </div>
      <button
        onClick={openModal}
        className="bg-lime-500 text-white px-4 py-2 mt-2 rounded hover:bg-lime-600"
      >
        View Details
      </button>

      <Transition show={modalOpen}>
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <Transition.Child
            enter="transition-opacity ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black opacity-50"></div>
          </Transition.Child>

          <Transition.Child
            enter="transition-opacity ease-out duration-300 delay-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="bg-white p-4 rounded w-96">
              <h2 className="text-xl mb-2">{name}</h2>
              <p>Authors: {authors.map((author) => author.name).join(', ')}</p>
              <p className="mt-4">{readme}</p>

              <button
                onClick={closeModal}
                className="bg-lime-500 text-white px-4 py-2 mt-4 rounded hover:bg-lime-600"
              >
                Close
              </button>
            </div>
          </Transition.Child>
        </div>
      </Transition>
    </div>
  );
};

export default Card;
